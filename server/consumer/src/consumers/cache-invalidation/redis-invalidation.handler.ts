import { Injectable, Logger } from '@nestjs/common';
import {
  RedisService,
  cacheKeyInventory,
  cacheKeyUserProfile,
  CacheInvalidationEventType,
  type CacheInvalidationPayload,
} from '@cook/shared';

/**
 * cache-invalidation 토픽 페이로드에 따라 Producer가 사용하는 Redis 캐시 키를 삭제한다.
 * 키는 `@cook/shared`의 `cacheKeyUserProfile` / `cacheKeyInventory`와 동일 규칙.
 */
@Injectable()
export class RedisInvalidationHandler {
  private readonly logger = new Logger(RedisInvalidationHandler.name);

  constructor(private readonly redisService: RedisService) {}

  async execute(payload: CacheInvalidationPayload): Promise<void> {
    switch (payload.type) {
      case CacheInvalidationEventType.USER_PROFILE: {
        const key = cacheKeyUserProfile(payload.userId);
        await this.redisService.del(key);
        this.logger.debug(`Redis invalidated: ${key}`);
        break;
      }
      case CacheInvalidationEventType.INVENTORY: {
        const key = cacheKeyInventory(payload.userId);
        await this.redisService.del(key);
        this.logger.debug(`Redis invalidated: ${key}`);
        break;
      }
    }
  }
}
