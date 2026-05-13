import type { EachMessagePayload } from 'kafkajs';
import { Injectable } from '@nestjs/common';
import {
  KAFKA_DLQ_TOPICS,
  KAFKA_TOPICS,
  ActivityEventType,
  type ActivityEventPayload,
  isActivityEventType,
} from '@mealio/shared';
import { BaseTopicProcessor } from '../base/base.processor';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { EventLogRepository } from 'src/persistence/repositories/mongodb/event-log.repository';
import { RecipeRepository } from 'src/persistence/repositories/postgresql/recipe.repository';
import { SchemaValidator } from 'src/processing/validation/schema.validator';
import { normalizeNumericId } from 'src/processing/transformation/data.normalizer';

function isValidActivityEventPayload(
  obj: unknown,
): obj is ActivityEventPayload {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  if (typeof o.type !== 'string' || !isActivityEventType(o.type)) return false;
  if (!o.actor || typeof o.actor !== 'object') return false;
  const actor = o.actor as Record<string, unknown>;
  if (
    actor.type !== 'user' &&
    actor.type !== 'system' &&
    actor.type !== 'admin'
  ) {
    return false;
  }
  return true;
}

/**
 * activity-events 토픽 전용 processor.
 * recipe.view, recipe.like, recipe.share, search.query, search.click 수신 시 EventLog에 기록.
 * recipe.view 시 Recipe viewCount 증가.
 * 비로그인 유저 활동 포함 (actor.userId 생략 가능).
 */
@Injectable()
export class ActivityEventsProcessor extends BaseTopicProcessor<ActivityEventPayload> {
  private readonly schemaValidator = new SchemaValidator({
    name: ActivityEventsProcessor.name,
  });

  constructor(
    retryStrategy: RetryStrategy,
    deadLetterHandler: DeadLetterHandler,
    private readonly eventLogRepository: EventLogRepository,
    private readonly recipeRepository: RecipeRepository,
  ) {
    super(ActivityEventsProcessor.name, retryStrategy, deadLetterHandler);
  }

  getTopic(): string {
    return KAFKA_TOPICS.ACTIVITY_EVENTS;
  }

  getDlqTopic(): string {
    return KAFKA_DLQ_TOPICS.ACTIVITY_EVENTS_DLQ;
  }

  protected parseEvent(
    message: EachMessagePayload,
  ): ActivityEventPayload | null {
    return this.schemaValidator.validateFromKafkaMessage<ActivityEventPayload>(
      message,
      isValidActivityEventPayload,
    );
  }

  protected async processEvent(
    event: ActivityEventPayload,
    _message: EachMessagePayload,
  ): Promise<void> {
    await this.eventLogRepository.create({
      type: event.type,
      actor: {
        type: event.actor.type,
        userId: event.actor.userId,
        ipAddress: event.actor.ipAddress,
        userAgent: event.actor.userAgent,
      },
      entity: event.entity,
      payload: event.payload,
      metadata: event.metadata,
    });

    if (
      event.type === ActivityEventType.RECIPE_VIEW &&
      event.entity?.type === 'recipe'
    ) {
      const recipeId = normalizeNumericId(event.entity.id, { min: 1 });
      if (recipeId !== null) {
        await this.recipeRepository
          .incrementViewCount(recipeId)
          .catch((err) => {
            this.logger.warn(
              `recipe.view viewCount increment failed recipeId=${recipeId}`,
              err,
            );
          });
      }
    }
  }
}
