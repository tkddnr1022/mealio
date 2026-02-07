import type { EachMessagePayload } from 'kafkajs';
import { Injectable } from '@nestjs/common';
import {
  KAFKA_DLQ_TOPICS,
  KAFKA_TOPICS,
  CacheInvalidationEventType,
  type CacheInvalidationPayload,
} from '@cook/shared';
import { BaseTopicProcessor } from '../../base/base.processor';
import { RetryStrategy } from '../../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { RedisInvalidationHandler } from './redis-invalidation.handler';

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

/** cache-invalidation 토픽 전용 processor (파싱·비즈니스·DLQ). Redis 무효화 수행, 추후 CDN 무효화 확장 가능. */
@Injectable()
export class CacheInvalidationProcessor extends BaseTopicProcessor<CacheInvalidationPayload> {
  constructor(
    retryStrategy: RetryStrategy,
    deadLetterHandler: DeadLetterHandler,
    private readonly redisInvalidationHandler: RedisInvalidationHandler,
  ) {
    super(
      CacheInvalidationProcessor.name,
      retryStrategy,
      deadLetterHandler,
    );
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
    const raw = message.message.value?.toString();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!isValidCacheInvalidationPayload(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  protected async processEvent(
    event: CacheInvalidationPayload,
    _message: EachMessagePayload,
  ): Promise<void> {
    await this.redisInvalidationHandler.execute(event);
  }
}
