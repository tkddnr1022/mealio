import type { EachMessagePayload } from 'kafkajs';
import { Injectable } from '@nestjs/common';
import {
  CHATBOT_EVENT_TYPES,
  KAFKA_DLQ_TOPICS,
  KAFKA_TOPICS,
} from '@cook/shared';
import type { ChatbotRequestEvent } from '@cook/shared';
import { BaseTopicProcessor } from '../base/base.processor';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { EventLogRepository } from 'src/persistence/repositories/mongodb/event-log.repository';
import { ProcessChatHandler } from './handlers/ProcessChatHandler';
import { SaveChatLogHandler } from './handlers/SaveChatLogHandler';

/** chatbot-requests 토픽 전용 processor (파싱·비즈니스·DLQ). EventLog에 chatbot.start / chatbot.message 기록. */
@Injectable()
export class ChatbotRequestProcessor extends BaseTopicProcessor<ChatbotRequestEvent> {
  constructor(
    retryStrategy: RetryStrategy,
    deadLetterHandler: DeadLetterHandler,
    private readonly eventLogRepository: EventLogRepository,
    private readonly processChatHandler: ProcessChatHandler,
    private readonly saveChatLogHandler: SaveChatLogHandler,
  ) {
    super(ChatbotRequestProcessor.name, retryStrategy, deadLetterHandler);
  }

  getTopic(): string {
    return KAFKA_TOPICS.CHATBOT_REQUESTS;
  }

  getDlqTopic(): string {
    return KAFKA_DLQ_TOPICS.CHATBOT_REQUESTS_DLQ;
  }

  protected parseEvent(
    message: EachMessagePayload,
  ): ChatbotRequestEvent | null {
    const raw = message.message.value?.toString();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as ChatbotRequestEvent;
      if (
        typeof parsed.userId !== 'number' ||
        typeof parsed.message !== 'string' ||
        !parsed.type ||
        !CHATBOT_EVENT_TYPES.includes(parsed.type)
      ) {
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
    await this.eventLogRepository.create({
      type: event.type,
      actor: {
        type: 'user' as const,
        userId: event.userId,
      },
      payload: {
        conversationId: event.conversationId,
        streamChannelId: event.streamChannelId,
        messageLength: event.message.length,
      },
    });

    const result = await this.processChatHandler.execute({
      userId: event.userId,
      message: event.message,
      conversationId: event.conversationId,
      streamChannelId: event.streamChannelId,
    });

    if ('error' in result) {
      await this.saveChatLogHandler.execute({
        userId: event.userId,
        conversationId: event.conversationId,
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
      userMessage: event.message,
      assistantMessage: result.fullContent,
      success: true,
      suggestedRecipeIds: result.suggestedRecipes.map((r) => r.id),
      usage: result.usage,
      model: result.model,
    });
  }
}
