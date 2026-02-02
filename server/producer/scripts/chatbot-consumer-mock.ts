/**
 * 챗봇 Consumer 역할 흉내 스크립트
 *
 * Kafka chatbot-requests 토픽을 구독하고, streamChannelId가 있는 메시지에 대해
 * Redis 채널(chatbot:stream:{streamChannelId})로 청크 → done 이벤트를 발행한다.
 * Producer SSE 스트리밍 동작을 로컬에서 확인할 때 사용한다.
 *
 * 실행 (producer 디렉터리에서):
 *   npx ts-node scripts/chatbot-consumer-mock.ts
 *
 * 필요 환경 변수: KAFKA_BROKERS, REDIS_URL (선택: KAFKA_CLIENT_ID)
 */

import 'dotenv/config';
import { Kafka } from 'kafkajs';
import Redis from 'ioredis';

const TOPIC = 'chatbot-requests';
const CHANNEL_PREFIX = 'chatbot:stream:';

interface ChatbotRequestEvent {
  userId: number;
  message: string;
  conversationId?: string;
  sessionId?: string;
  streamChannelId?: string;
  timestamp: string;
}

function getRedisClient(): Redis {
  const url = process.env.REDIS_URL!;
  return new Redis(url, { maxRetriesPerRequest: null });
}

function getKafkaConsumer() {
  const brokers = process.env.KAFKA_BROKERS!
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);
  const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID!,
    brokers,
  });
  return kafka.consumer({ groupId: 'chatbot-consumer-mock' });
}

function getStreamChannel(streamChannelId: string): string {
  return `${CHANNEL_PREFIX}${streamChannelId}`;
}

/** GPT 스트리밍을 흉내: 문장을 잘라서 청크로 보낸 뒤 done 발행 */
async function simulateStreamAndPublish(
  redis: Redis,
  channel: string,
  conversationId: string,
): Promise<void> {
  const fullMessage =
    '네, 오늘 저녁으로는 김치볶음밥을 추천드립니다. 집에 있는 재료로 15분이면 완성할 수 있어요. ' +
    '김치는 숙성된 것으로 한 줌 정도 넣고, 밥은 전날 밥이면 더 좋습니다. ' +
    '달걀을 넣으면 영양도 좋아지고 맛도 풍부해져요. 마지막에 참기름 한 방울 넣으면 향이 올라와서 더 맛있습니다. ' +
    '간은 소금이나 간장으로 살짝만 맞춰 주시면 됩니다.';
  const chunks = fullMessage.split(/(?<=[.!?]|\s)/).filter(Boolean);

  const CHUNK_DELAY_MS = 250;

  for (const chunk of chunks) {
    redis.publish(channel, JSON.stringify({ type: 'chunk', data: chunk }));
    await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
  }

  redis.publish(
    channel,
    JSON.stringify({
      type: 'done',
      data: {
        conversationId,
        message: fullMessage,
        suggestedRecipes: [
          { id: 1, title: '김치볶음밥', matchScore: 95 },
          { id: 2, title: '계란볶음밥', matchScore: 80 },
        ],
      },
    }),
  );
}

async function main(): Promise<void> {
  const redis = getRedisClient();
  const consumer = getKafkaConsumer();

  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

  console.log(
    `[chatbot-consumer-mock] Subscribed to ${TOPIC}. Waiting for messages...`,
  );

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const raw = message.value?.toString();
      if (!raw) return;

      let event: ChatbotRequestEvent;
      try {
        event = JSON.parse(raw) as ChatbotRequestEvent;
      } catch {
        console.warn('[chatbot-consumer-mock] Invalid JSON, skip');
        return;
      }

      const {
        streamChannelId,
        conversationId,
        userId,
        message: userMessage,
      } = event;
      console.log(
        `[chatbot-consumer-mock] Received userId=${userId} message="${userMessage?.slice(0, 30)}..." streamChannelId=${streamChannelId ?? 'none'}`,
      );

      if (!streamChannelId) {
        console.log(
          '[chatbot-consumer-mock] No streamChannelId, skip (non-SSE request)',
        );
        return;
      }

      const channel = getStreamChannel(streamChannelId);
      const convId = conversationId ?? `conv_${streamChannelId}`;

      try {
        await simulateStreamAndPublish(redis, channel, convId);
        console.log(
          `[chatbot-consumer-mock] Published chunk+done to ${channel}`,
        );
      } catch (err) {
        console.error('[chatbot-consumer-mock] Publish error', err);
        redis.publish(
          channel,
          JSON.stringify({
            type: 'error',
            data: { message: (err as Error).message },
          }),
        );
      }
    },
  });
}

main().catch((err) => {
  console.error('[chatbot-consumer-mock] Fatal', err);
  process.exit(1);
});
