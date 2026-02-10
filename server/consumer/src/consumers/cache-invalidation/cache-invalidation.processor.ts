import type { EachMessagePayload } from 'kafkajs';
import { Injectable } from '@nestjs/common';
import {
  KAFKA_DLQ_TOPICS,
  KAFKA_TOPICS,
  CacheInvalidationEventType,
  type CacheInvalidationPayload,
} from '@cook/shared';
import { BaseTopicProcessor } from '../base/base.processor';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { RedisInvalidationHandler } from './redis-invalidation.handler';
import { SchemaValidator } from 'src/processing/validation/schema.validator';
import {
  BusinessRuleValidator,
  type BusinessRule,
} from 'src/processing/validation/business-rule.validator';

function isValidCacheInvalidationPayload(
  obj: unknown,
): obj is CacheInvalidationPayload {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  if (
    o.type !== CacheInvalidationEventType.USER_PROFILE &&
    o.type !== CacheInvalidationEventType.USER_INGREDIENT
  )
    return false;
  if (typeof (o as { userId?: unknown }).userId !== 'number') return false;
  return true;
}

const cacheInvalidationBusinessRules: BusinessRule<CacheInvalidationPayload>[] =
  [
    (event) => {
      if (event.userId <= 0) {
        return {
          code: 'USER_ID_INVALID',
          message: 'userId must be a positive integer',
          detail: { userId: event.userId },
        };
      }
      return null;
    },
  ];

/** cache-invalidation 토픽 전용 processor (파싱·비즈니스·DLQ). Redis 무효화 수행, 추후 CDN 무효화 확장 가능. */
@Injectable()
export class CacheInvalidationProcessor extends BaseTopicProcessor<CacheInvalidationPayload> {
  private readonly schemaValidator = new SchemaValidator({
    name: CacheInvalidationProcessor.name,
  });

  private readonly businessRuleValidator =
    new BusinessRuleValidator<CacheInvalidationPayload>(
      cacheInvalidationBusinessRules,
      {
        name: CacheInvalidationProcessor.name,
        throwOnViolation: true,
      },
    );

  constructor(
    retryStrategy: RetryStrategy,
    deadLetterHandler: DeadLetterHandler,
    private readonly redisInvalidationHandler: RedisInvalidationHandler,
  ) {
    super(CacheInvalidationProcessor.name, retryStrategy, deadLetterHandler);
  }

  getTopic(): string {
    return KAFKA_TOPICS.CACHE_INVALIDATION;
  }

  getDlqTopic(): string {
    return KAFKA_DLQ_TOPICS.CACHE_INVALIDATION_DLQ;
  }

  protected parseEvent(
    message: EachMessagePayload,
  ): CacheInvalidationPayload | null {
    return this.schemaValidator.validateFromKafkaMessage<CacheInvalidationPayload>(
      message,
      isValidCacheInvalidationPayload,
    );
  }

  protected async processEvent(
    event: CacheInvalidationPayload,
    _message: EachMessagePayload,
  ): Promise<void> {
    // 스키마 검증 이후 추가 비즈니스 규칙 검증
    this.businessRuleValidator.validate(event);

    await this.redisInvalidationHandler.execute(event);
  }
}
