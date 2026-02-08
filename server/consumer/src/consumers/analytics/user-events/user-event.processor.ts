import type { EachMessagePayload } from 'kafkajs';
import { Injectable } from '@nestjs/common';
import {
  KAFKA_DLQ_TOPICS,
  KAFKA_TOPICS,
  UserEventType,
  UserIngredientEventType,
  isUserNicknameUpdateEvent,
  type UserEvent,
  type UserIngredientEvent,
} from '@cook/shared';
import { BaseTopicProcessor } from '../../base/base.processor';
import { RetryStrategy } from '../../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { UpdateUserProfileHandler } from './handlers/UpdateUserProfileHandler';
import { TrackUserActivityHandler } from './handlers/TrackUserActivityHandler';
import { RecommendationHandler } from './handlers/RecommendationHandler';
import { UpdateUserIngredientHandler } from './handlers/UpdateUserIngredientHandler';

export type UserEventPayload = UserEvent | UserIngredientEvent;

const USER_EVENT_TYPES = new Set<string>([
  UserEventType.NICKNAME_UPDATE,
  UserIngredientEventType.BULK_UPDATE,
  UserIngredientEventType.ADD,
  UserIngredientEventType.REMOVE,
  UserIngredientEventType.FAVORITES_UPDATE,
  UserIngredientEventType.FAVORITES_ADD,
  UserIngredientEventType.FAVORITES_REMOVE,
]);

function isValidUserEventPayload(obj: unknown): obj is UserEventPayload {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  if (typeof o.type !== 'string' || !USER_EVENT_TYPES.has(o.type)) return false;
  if (typeof o.userId !== 'number') return false;
  return true;
}

function isUserIngredientEvent(
  event: UserEventPayload,
): event is UserIngredientEvent {
  return Object.values(UserIngredientEventType).includes(
    event.type as UserIngredientEventType,
  );
}

/** user-events 토픽 전용 processor (파싱·비즈니스·DLQ). */
@Injectable()
export class UserEventProcessor extends BaseTopicProcessor<UserEventPayload> {
  constructor(
    retryStrategy: RetryStrategy,
    deadLetterHandler: DeadLetterHandler,
    private readonly updateUserProfileHandler: UpdateUserProfileHandler,
    private readonly trackUserActivityHandler: TrackUserActivityHandler,
    private readonly recommendationHandler: RecommendationHandler,
    private readonly updateUserIngredientHandler: UpdateUserIngredientHandler,
  ) {
    super(UserEventProcessor.name, retryStrategy, deadLetterHandler);
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
    if (isUserNicknameUpdateEvent(event as UserEvent)) {
      await this.updateUserProfileHandler.execute(event as UserEvent);
    }
    if (isUserIngredientEvent(event)) {
      await this.updateUserIngredientHandler.execute(event);
    }
    await this.trackUserActivityHandler.execute(event);
    await this.recommendationHandler.execute(event);
  }
}
