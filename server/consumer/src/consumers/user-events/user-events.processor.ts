import type { EachMessagePayload } from 'kafkajs';
import { Injectable } from '@nestjs/common';
import {
  KAFKA_DLQ_TOPICS,
  KAFKA_TOPICS,
  UserEventType,
  type UserEvent,
  type UserIngredientEvent,
  isUserEvent,
  isUserIngredientEvent,
} from '@cook/shared';
import { BaseTopicProcessor } from '../base/base.processor';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { UpdateUserProfileHandler } from './handlers/UpdateUserProfileHandler';
import { TrackUserActivityHandler } from './handlers/TrackUserActivityHandler';
import { RecommendationHandler } from './handlers/RecommendationHandler';
import { UpdateUserIngredientHandler } from './handlers/UpdateUserIngredientHandler';

export type UserEventPayload = UserEvent | UserIngredientEvent;

function isValidUserEventPayload(obj: unknown): obj is UserEventPayload {
  const o = obj as Record<string, unknown>;
  if (!isUserEvent(obj) && !isUserIngredientEvent(obj)) return false;
  if ('userId' in o && typeof o.userId !== 'number') return false;
  return true;
}

/** user-events 토픽 전용 processor (파싱·비즈니스·DLQ). */
@Injectable()
export class UserEventsProcessor extends BaseTopicProcessor<UserEventPayload> {
  constructor(
    retryStrategy: RetryStrategy,
    deadLetterHandler: DeadLetterHandler,
    private readonly updateUserProfileHandler: UpdateUserProfileHandler,
    private readonly trackUserActivityHandler: TrackUserActivityHandler,
    private readonly recommendationHandler: RecommendationHandler,
    private readonly updateUserIngredientHandler: UpdateUserIngredientHandler,
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
    const raw = message.message.value?.toString();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!isValidUserEventPayload(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  protected async processEvent(
    event: UserEventPayload,
    _message: EachMessagePayload,
  ): Promise<void> {
    if (event.type === UserEventType.NICKNAME_UPDATE) {
      await this.updateUserProfileHandler.execute(event);
    } else if (isUserIngredientEvent(event)) {
      await this.updateUserIngredientHandler.execute(event);
    }
    await this.trackUserActivityHandler.execute(event);
    await this.recommendationHandler.execute(event);
  }
}
