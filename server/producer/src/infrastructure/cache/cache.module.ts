import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';
import { CacheService } from './cache.service';
import { RecipeCacheStrategy } from './strategies/recipe-cache-strategy';
import { IngredientCacheStrategy } from './strategies/ingredient-cache-strategy';
import { UserCacheStrategy } from './strategies/user-cache-strategy';

/**
 * 캐시 모듈
 * Redis 기반 캐시 서비스 및 전략을 제공한다.
 * Global 모듈로 등록하여 어디서든 사용 가능하도록 한다.
 */
@Global()
@Module({
  providers: [
    RedisService,
    CacheService,
    RecipeCacheStrategy,
    IngredientCacheStrategy,
    UserCacheStrategy,
  ],
  exports: [
    RedisService,
    CacheService,
    RecipeCacheStrategy,
    IngredientCacheStrategy,
    UserCacheStrategy,
  ],
})
export class CacheModule {}
