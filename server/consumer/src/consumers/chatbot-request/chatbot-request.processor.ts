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
import { SchemaValidator } from 'src/processing/validation/schema.validator';
import {
  BusinessRuleValidator,
  type BusinessRule,
} from 'src/processing/validation/business-rule.validator';

function isValidChatbotRequestEvent(
  obj: unknown,
): obj is ChatbotRequestEvent {
  if (!obj || typeof obj !== 'object') return false;
  const e = obj as ChatbotRequestEvent;
  if (typeof e.userId !== 'number') return false;
  if (typeof e.message !== 'string') return false;
  if (!e.type || !CHATBOT_EVENT_TYPES.includes(e.type)) return false;
  return true;
}

const chatbotBusinessRules: BusinessRule<ChatbotRequestEvent>[] = [
  (event) => {
    if (event.userId <= 0) {
      return {
        code: 'USER_ID_INVALID',
        message: 'userId must be a positive integer',
        detail: { userId: event.userId },
      };
    }
    if (!event.message || event.message.trim().length === 0) {
      return {
        code: 'MESSAGE_EMPTY',
        message: 'message must not be empty',
      };
    }
    if (!event.streamChannelId) {
      return {
        code: 'STREAM_CHANNEL_ID_REQUIRED',
        message: 'streamChannelId is required for chatbot requests',
      };
    }
    return null;
  },
];

/** chatbot-requests 토픽 전용 processor (파싱·비즈니스·DLQ). EventLog에 chatbot.start / chatbot.message 기록. */
@Injectable()
export class ChatbotRequestProcessor extends BaseTopicProcessor<ChatbotRequestEvent> {
  private readonly schemaValidator = new SchemaValidator({
    name: ChatbotRequestProcessor.name,
  });

  private readonly businessRuleValidator =
    new BusinessRuleValidator<ChatbotRequestEvent>(chatbotBusinessRules, {
      name: ChatbotRequestProcessor.name,
      throwOnViolation: true,
    });

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
    return this.schemaValidator.validateFromKafkaMessage<ChatbotRequestEvent>(
      message,
      isValidChatbotRequestEvent,
    );
  }

  protected async processEvent(
    event: ChatbotRequestEvent,
    _message: EachMessagePayload,
  ): Promise<void> {
    // 스키마 검증 이후 추가 비즈니스 규칙 검증
    this.businessRuleValidator.validate(event);

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
