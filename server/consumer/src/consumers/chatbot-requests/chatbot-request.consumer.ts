import type { EachMessagePayload } from 'kafkajs';
import { Kafka } from 'kafkajs';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { KAFKA_TOPICS, createKafkaConfig } from '@cook/shared';
import type { ChatbotRequestEvent } from '@cook/shared';
import { BaseConsumer } from '../base/base.consumer';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { ProcessChatHandler } from './handlers/ProcessChatHandler';
import { SaveChatLogHandler } from './handlers/SaveChatLogHandler';

@Injectable()
export class ChatbotRequestConsumer
  extends BaseConsumer<ChatbotRequestEvent>
  implements OnModuleInit, OnModuleDestroy
{
  private kafka: Kafka;
  private consumer: ReturnType<Kafka['consumer']> | null = null;

  constructor(
    retryStrategy: RetryStrategy,
    deadLetterHandler: DeadLetterHandler,
    private readonly processChatHandler: ProcessChatHandler,
    private readonly saveChatLogHandler: SaveChatLogHandler,
  ) {
    super(
      ChatbotRequestConsumer.name,
      retryStrategy,
      deadLetterHandler,
    );
    this.kafka = new Kafka(createKafkaConfig());
  }

  /** 처리 중 broker에 살아 있음을 알리기 위한 heartbeat 주기(ms) */
  private static readonly HEARTBEAT_INTERVAL_MS = 10_000;

  async onModuleInit(): Promise<void> {
    const groupId = process.env.KAFKA_CONSUMER_GROUP_ID!;
    // 챗봇 처리(OpenAI 스트림 + 도구 호출 + 로그 저장)가 30초 이상 걸릴 수 있으므로
    // sessionTimeout을 2분으로 설정. 기본값(30초)이면 처리 완료 전 리밸런스되어
    // 오프셋 미커밋 → 동일 메시지 재처리 → 동일 대화에 대한 응답이 여러 번 저장되는 현상 발생.
    this.consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 120_000, // 2분
    });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: this.getTopic() });
    await this.consumer.run({
      eachBatch: async ({ batch, heartbeat, isRunning, isStale }) => {
        for (const message of batch.messages) {
          if (!isRunning() || isStale()) break;

          const payload = {
            topic: batch.topic,
            partition: batch.partition,
            message,
          } as EachMessagePayload;

          const timer = setInterval(() => {
            heartbeat().catch((err) =>
              this.logger.warn('Heartbeat failed', err),
            );
          }, ChatbotRequestConsumer.HEARTBEAT_INTERVAL_MS);
          try {
            await this.handleWithRetryAndDlq(payload);
          } finally {
            clearInterval(timer);
          }
        }
      },
      eachBatchAutoResolve: true,
    });
    this.logger.log(
      `Subscribed to ${this.getTopic()} (groupId=${groupId})`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.consumer = null;
    }
  }

  protected getTopic(): string {
    return KAFKA_TOPICS.CHATBOT_REQUESTS;
  }

  protected parseEvent(message: EachMessagePayload): ChatbotRequestEvent | null {
    const raw = message.message.value?.toString();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as ChatbotRequestEvent;
      if (typeof parsed.userId !== 'number' || typeof parsed.message !== 'string') {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  protected async processEvent(
    event: ChatbotRequestEvent,
    _message: EachMessagePayload,
  ): Promise<void> {
    const result = await this.processChatHandler.execute({
      userId: event.userId,
      message: event.message,
      conversationId: event.conversationId,
      sessionId: event.sessionId,
      streamChannelId: event.streamChannelId,
    });

    if ('error' in result) {
      await this.saveChatLogHandler.execute({
        userId: event.userId,
        conversationId: event.conversationId,
        sessionId: event.sessionId,
        userMessage: event.message,
        assistantMessage: '',
        success: false,
        error: result.error,
      });
      throw new Error(result.error);
    }

    await this.saveChatLogHandler.execute({
      userId: event.userId,
      conversationId: event.conversationId,
      sessionId: event.sessionId,
      userMessage: event.message,
      assistantMessage: result.fullContent,
      success: true,
      suggestedRecipeIds: result.suggestedRecipes.map((r) => r.id),
      usage: result.usage,
      model: undefined,
    });
  }
}
