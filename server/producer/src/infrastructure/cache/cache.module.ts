import { Module, Global } from '@nestjs/common';
import { RedisModule } from '@mealio/shared';
import { CacheService } from './cache.service';
import { RecipeCacheStrategy } from './strategies/recipe-cache-strategy';
import { IngredientCacheStrategy } from './strategies/ingredient-cache-strategy';
import { UserCacheStrategy } from './strategies/user-cache-strategy';
import { InventoryCacheStrategy } from './strategies/inventory-cache-strategy';

/**
 * 캐시 모듈
 * Redis 기반 캐시 서비스 및 전략을 제공한다.
 * RedisService는 shared/redis(RedisModule)에서 주입받는다.
 * Global 모듈로 등록하여 어디서든 사용 가능하도록 한다.
 */
@Global()
@Module({
  imports: [RedisModule],
  providers: [
    CacheService,
    RecipeCacheStrategy,
    IngredientCacheStrategy,
    UserCacheStrategy,
    InventoryCacheStrategy,
  ],
  exports: [
    CacheService,
    RecipeCacheStrategy,
    IngredientCacheStrategy,
    UserCacheStrategy,
    InventoryCacheStrategy,
  ],
})
export class CacheModule {}
