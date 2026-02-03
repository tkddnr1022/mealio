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

/** Kafka 페이로드 (명세: userIngredientIds, favoriteIngredientIds 포함 가능) */
export interface ChatbotRequestPayload extends ChatbotRequestEvent {
  userIngredientIds?: number[];
  favoriteIngredientIds?: number[];
}

@Injectable()
export class ChatbotRequestConsumer
  extends BaseConsumer<ChatbotRequestPayload>
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

  async onModuleInit(): Promise<void> {
    const groupId = process.env.KAFKA_CONSUMER_GROUP_ID!;
    this.consumer = this.kafka.consumer({ groupId });
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: this.getTopic() });
    await this.consumer.run({
      eachMessage: async (payload) => {
        await this.handleWithRetryAndDlq(payload);
      },
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

  protected parseEvent(message: EachMessagePayload): ChatbotRequestPayload | null {
    const raw = message.message.value?.toString();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as ChatbotRequestPayload;
      if (typeof parsed.userId !== 'number' || typeof parsed.message !== 'string') {
        return null;
      }
      return {
        ...parsed,
        userIngredientIds: parsed.userIngredientIds ?? [],
        favoriteIngredientIds: parsed.favoriteIngredientIds ?? [],
      };
    } catch {
      return null;
    }
  }

  protected async processEvent(
    event: ChatbotRequestPayload,
    _message: EachMessagePayload,
  ): Promise<void> {
    const result = await this.processChatHandler.execute({
      userId: event.userId,
      message: event.message,
      conversationId: event.conversationId,
      sessionId: event.sessionId,
      streamChannelId: event.streamChannelId,
      userIngredientIds: event.userIngredientIds,
      favoriteIngredientIds: event.favoriteIngredientIds,
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
