import type { EachMessagePayload } from 'kafkajs';
import { Injectable } from '@nestjs/common';
import {
  KAFKA_DLQ_TOPICS,
  KAFKA_TOPICS,
  UserEventType,
  type UserEvent,
  type InventoryEvent,
  isUserEvent,
  isInventoryEvent,
} from '@mealio/shared';
import { BaseTopicProcessor } from '../base/base.processor';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import {
  BusinessRuleValidator,
  type BusinessRule,
} from 'src/processing/validation/business-rule.validator';
import { SchemaValidator } from 'src/processing/validation/schema.validator';
import { UpdateUserProfileHandler } from './handlers/UpdateUserProfileHandler';
import { TrackUserActivityHandler } from './handlers/TrackUserActivityHandler';
import { RecommendationHandler } from './handlers/RecommendationHandler';
import { UpdateInventoryHandler } from './handlers/UpdateInventoryHandler';

export type UserEventPayload = UserEvent | InventoryEvent;

function isValidUserEventPayload(obj: unknown): obj is UserEventPayload {
  const o = obj as Record<string, unknown>;
  if (!isUserEvent(obj) && !isInventoryEvent(obj)) return false;
  if ('userId' in o && typeof o.userId !== 'number') return false;
  return true;
}

const userEventBusinessRules: BusinessRule<UserEventPayload>[] = [
  (event) => {
    const anyEvent = event as unknown as Record<string, unknown>;
    if ('userId' in anyEvent) {
      const userId = anyEvent.userId;
      if (typeof userId === 'number' && userId <= 0) {
        return {
          code: 'USER_ID_INVALID',
          message: 'userId must be a positive integer',
          detail: { userId },
        };
      }
    }
    return null;
  },
];

/** user-events 토픽 전용 processor (파싱·비즈니스·DLQ). */
@Injectable()
export class UserEventsProcessor extends BaseTopicProcessor<UserEventPayload> {
  private readonly schemaValidator = new SchemaValidator({
    name: UserEventsProcessor.name,
  });

  private readonly businessRuleValidator =
    new BusinessRuleValidator<UserEventPayload>(userEventBusinessRules, {
      name: UserEventsProcessor.name,
      throwOnViolation: true,
    });

  constructor(
    retryStrategy: RetryStrategy,
    deadLetterHandler: DeadLetterHandler,
    private readonly updateUserProfileHandler: UpdateUserProfileHandler,
    private readonly trackUserActivityHandler: TrackUserActivityHandler,
    private readonly recommendationHandler: RecommendationHandler,
    private readonly updateInventoryHandler: UpdateInventoryHandler,
  ) {
    super(UserEventsProcessor.name, retryStrategy, deadLetterHandler);
  }

  getTopic(): string {
    return KAFKA_TOPICS.USER_EVENTS;
  }

  getDlqTopic(): string {
    return KAFKA_DLQ_TOPICS.USER_EVENTS_DLQ;
  }

  protected parseEvent(message: EachMessagePayload): UserEventPayload | null {
    return this.schemaValidator.validateFromKafkaMessage<UserEventPayload>(
      message,
      isValidUserEventPayload,
    );
  }

  protected async processEvent(
    event: UserEventPayload,
    _message: EachMessagePayload,
  ): Promise<void> {
    // 스키마 검증 이후 추가 비즈니스 규칙 검증
    this.businessRuleValidator.validate(event);

    if (event.type === UserEventType.NICKNAME_UPDATE) {
      await this.updateUserProfileHandler.execute(event);
    } else if (isInventoryEvent(event)) {
      await this.updateInventoryHandler.execute(event);
    }
    await this.trackUserActivityHandler.execute(event);
    await this.recommendationHandler.execute(event);
  }
}
