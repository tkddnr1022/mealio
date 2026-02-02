import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import {
  ChatbotRequestEvent,
  KAFKA_TOPICS,
  KAFKA_DLQ_TOPICS,
  createKafkaConfig,
  getChatbotStreamChannel,
  RedisService,
  type ChatbotStreamEvent,
} from '@cook/shared';

/** OpenAI insufficient_quota 등 재시도해도 해결되지 않는 오류는 재시도하지 않음 */
function isRetryableOpenAIError(error: unknown): boolean {
  const code =
    (error as { code?: string; error?: { code?: string } })?.code ??
    (error as { error?: { code?: string } })?.error?.code;
  return code !== 'insufficient_quota';
}
import { ProcessChatHandler } from './handlers/process-chat.handler';
import { SaveChatLogHandler } from './handlers/save-chat-log.handler';
import { UpdateContextHandler } from './handlers/update-context.handler';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from '../../reliability/dead-letter/dlq.handler';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatbotRequestConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChatbotRequestConsumer.name);
  private kafka!: Kafka;
  private consumer!: Consumer;
  private isRunning = false;

  constructor(
    private readonly redisService: RedisService,
    private readonly processChatHandler: ProcessChatHandler,
    private readonly saveChatLogHandler: SaveChatLogHandler,
    private readonly updateContextHandler: UpdateContextHandler,
    private readonly retryStrategy: RetryStrategy,
    private readonly deadLetterHandler: DeadLetterHandler,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const kafkaConfig = createKafkaConfig('consumer');
    this.kafka = new Kafka(kafkaConfig);
    this.consumer = this.kafka.consumer({
      groupId: this.configService.getOrThrow<string>('KAFKA_CONSUMER_GROUP_ID'),
    });

    try {
      await this.consumer.connect();
      await this.deadLetterHandler.connect();
      await this.consumer.subscribe({
        topic: KAFKA_TOPICS.CHATBOT_REQUESTS,
        fromBeginning: false,
      });

      await this.consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload);
        },
      });

      this.isRunning = true;
      this.logger.log(
        `ChatbotRequestConsumer is running (topic=${KAFKA_TOPICS.CHATBOT_REQUESTS})`,
      );
    } catch (error) {
      this.logger.error('Failed to start ChatbotRequestConsumer', error as Error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.consumer || !this.isRunning) {
      return;
    }

    try {
      await this.consumer.disconnect();
      await this.deadLetterHandler.disconnect();
      this.logger.log('ChatbotRequestConsumer disconnected');
    } catch (error) {
      this.logger.error(
        'Error while disconnecting ChatbotRequestConsumer',
        error as Error,
      );
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { message, partition } = payload;
    if (!message.value) {
      this.logger.warn('Received message without value, skipping');
      return;
    }

    let event: ChatbotRequestEvent;
    try {
      event = JSON.parse(message.value.toString()) as ChatbotRequestEvent;
    } catch (error) {
      this.logger.error('Failed to parse ChatbotRequestEvent', error as Error);
      return;
    }

    if (
      typeof event?.userId !== 'number' ||
      typeof event?.message !== 'string'
    ) {
      this.logger.warn(
        'Invalid ChatbotRequestEvent shape (missing userId/message); sending to DLQ and committing',
      );
      try {
        await this.deadLetterHandler.send({
          topic: KAFKA_DLQ_TOPICS.CHATBOT_REQUESTS_DLQ,
          partition,
          offset: message.offset,
          key: message.key?.toString() ?? null,
          value: message.value.toString(),
          reason: 'invalid payload (not ChatbotRequestEvent)',
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        this.logger.warn('DLQ send failed for invalid payload', e as Error);
      }
      return;
    }

    // 멱등성 보장: 동일한 이벤트가 중복 전달되면 처리하지 않음
    const idempotencyKey = `chatbot:req:${event.userId}:${event.timestamp}`;
    const redisClient = this.redisService.getClient();
    // ioredis set with NX / EX 옵션 (타입 단언 사용)
    const setResult = (await (redisClient as any).set(
      idempotencyKey,
      '1',
      'NX',
      'EX',
      60 * 60, // 1시간 동안 중복 방지
    )) as string | null;
    if (setResult === null) {
      this.logger.warn(
        `Duplicate chatbot request detected. Skipping. key=${idempotencyKey}`,
      );
      return;
    }

    try {
      const processed = await this.retryStrategy.execute(
        async () => this.processChatHandler.execute(event),
        {
          operationName: 'chatbot-request#process',
          isRetryable: isRetryableOpenAIError,
        },
      );

      await this.saveChatLogHandler.execute(event, processed);
      await this.updateContextHandler.execute(event, processed);

      if (event.streamChannelId) {
        await this.publishStreamEvents(
          event,
          processed.reply,
          processed.suggestedRecipes,
        );
      }

    } catch (error) {
      this.logger.error('Error while handling chatbot request', error as Error);

      await this.deadLetterHandler.send({
        topic: KAFKA_DLQ_TOPICS.CHATBOT_REQUESTS_DLQ,
        partition,
        offset: message.offset,
        key: message.key?.toString() ?? null,
        value: message.value.toString(),
        reason: (error as Error).message,
        timestamp: new Date().toISOString(),
      });

      if (event.streamChannelId) {
        await this.publishStreamError(
          event.streamChannelId,
          '챗봇 응답 처리 중 오류가 발생했습니다.',
        );
      }
    }
  }

  private async publishStreamEvents(
    event: ChatbotRequestEvent,
    reply: string,
    suggestedRecipes: Array<{ id: number; title: string; matchScore: number }> | null,
  ): Promise<void> {
    const channel = getChatbotStreamChannel(event.streamChannelId!);
    const client = this.redisService.getClient();

    // 단일 응답을 여러 chunk로 나누어 스트리밍
    const chunks = this.splitReplyIntoChunks(reply);
    for (const chunk of chunks) {
      const chunkPayload: ChatbotStreamEvent = {
        type: 'chunk',
        data: chunk,
      };
      await client.publish(channel, JSON.stringify(chunkPayload));
    }

    const donePayload: ChatbotStreamEvent = {
      type: 'done',
      data: {
        conversationId: event.conversationId ?? event.sessionId ?? 'unknown',
        message: reply,
        suggestedRecipes: suggestedRecipes ?? undefined,
      },
    };

    await client.publish(channel, JSON.stringify(donePayload));
  }

  /**
   * 응답 문자열을 여러 chunk로 나누어 SSE 스트리밍에 사용한다.
   * - 너무 작은 chunk를 방지하기 위해 최소 길이를 유지한다.
   */
  private splitReplyIntoChunks(reply: string, minChunkSize = 80): string[] {
    if (reply.length <= minChunkSize) {
      return [reply];
    }

    const sentences = reply.split(/(?<=[.!?？！。])\s+/);
    const chunks: string[] = [];
    let buffer = '';

    for (const sentence of sentences) {
      if ((buffer + ' ' + sentence).trim().length >= minChunkSize) {
        if (buffer) {
          chunks.push(buffer.trim());
          buffer = sentence;
        } else {
          chunks.push(sentence);
        }
      } else {
        buffer = `${buffer} ${sentence}`.trim();
      }
    }

    if (buffer) {
      chunks.push(buffer.trim());
    }

    return chunks;
  }

  private async publishStreamError(
    streamChannelId: string,
    message: string,
  ): Promise<void> {
    const channel = getChatbotStreamChannel(streamChannelId);
    const client = this.redisService.getClient();
    const errorPayload: ChatbotStreamEvent = {
      type: 'error',
      data: { message },
    };
    await client.publish(channel, JSON.stringify(errorPayload));
  }
}

