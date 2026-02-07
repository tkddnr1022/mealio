import { Injectable, Logger } from '@nestjs/common';
import {
  RedisService,
  CACHE_KEY_PREFIX,
  CacheInvalidationEventType,
  type CacheInvalidationPayload,
} from '@cook/shared';

/**
 * cache-invalidation 토픽 페이로드에 따라 Producer가 사용하는 Redis 캐시 키를 삭제한다.
 * 키 규칙: user:{userId}, user-ingredient:{userId} (Producer의 CacheStrategy와 동일)
 */
@Injectable()
export class RedisInvalidationHandler {
  private readonly logger = new Logger(RedisInvalidationHandler.name);

  constructor(private readonly redisService: RedisService) {}

  async execute(payload: CacheInvalidationPayload): Promise<void> {
    switch (payload.type) {
      case CacheInvalidationEventType.USER_PROFILE: {
        const key = `${CACHE_KEY_PREFIX.USER}:${payload.userId}`;
        await this.redisService.del(key);
        this.logger.debug(`Redis invalidated: ${key}`);
        break;
      }
      case CacheInvalidationEventType.USER_INGREDIENT: {
        const key = `${CACHE_KEY_PREFIX.USER_INGREDIENT}:${payload.userId}`;
        await this.redisService.del(key);
        this.logger.debug(`Redis invalidated: ${key}`);
        break;
      }
    }
  }
}
