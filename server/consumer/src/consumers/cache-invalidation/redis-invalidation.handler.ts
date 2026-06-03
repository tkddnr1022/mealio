import { Injectable, Logger } from '@nestjs/common';
import {
  RedisService,
  cacheKeyInventory,
  cacheKeyRecommendation,
  cacheKeyRecipeDetail,
  cacheKeyUserProfile,
  cachePatternRecipeInvalidation,
  cachePatternIngredientInvalidation,
  CacheInvalidationEventType,
  type CacheInvalidationPayload,
} from '@mealio/shared';
// TODO: 배치 위치 검토(cache-invalidation/handler 레이어 생성)
/**
 * cache-invalidation 토픽 페이로드에 따라 Producer가 사용하는 Redis 캐시 키를 삭제한다.
 * 키는 `@mealio/shared`의 `cacheKeyUserProfile` / `cacheKeyInventory`와 동일 규칙.
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
      case CacheInvalidationEventType.RECIPE: {
        const uniqueRecipeIds = [...new Set(payload.recipeIds)];
        for (const recipeId of uniqueRecipeIds) {
          const detailKey = cacheKeyRecipeDetail(recipeId);
          await this.redisService.del(detailKey);
          this.logger.debug(`Redis invalidated: ${detailKey}`);
        }

        const { patterns, singleKeys } = cachePatternRecipeInvalidation();
        for (const key of singleKeys) {
          await this.redisService.del(key);
          this.logger.debug(`Redis invalidated: ${key}`);
        }
        for (const pattern of patterns) {
          const deleted = await this.redisService.delByPattern(pattern);
          this.logger.debug(
            `Redis invalidated by pattern: ${pattern} (deleted=${deleted})`,
          );
        }
        break;
      }
      case CacheInvalidationEventType.RECOMMENDATION: {
        const key = cacheKeyRecommendation(payload.userId);
        await this.redisService.del(key);
        this.logger.debug(`Redis invalidated: ${key}`);
        break;
      }
      case CacheInvalidationEventType.INGREDIENT: {
        const { patterns, singleKeys } = cachePatternIngredientInvalidation();
        for (const key of singleKeys) {
          await this.redisService.del(key);
          this.logger.debug(`Redis invalidated: ${key}`);
        }
        for (const pattern of patterns) {
          const deleted = await this.redisService.delByPattern(pattern);
          this.logger.debug(
            `Redis invalidated by pattern: ${pattern} (deleted=${deleted})`,
          );
        }
        break;
      }
    }
  }
}
