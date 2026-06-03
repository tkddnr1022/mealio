import { Injectable } from '@nestjs/common';
import { CACHE_KEY_PREFIX, buildCacheKey } from '@mealio/shared';
import { CACHE_TTL_INGREDIENT_SECONDS } from '../../../policy/cache.policy';
import { CacheStrategy } from './cache-strategy.interface';

/**
 * Ingredient 캐시 전략
 * TTL: 24시간 (86400초)
 */
@Injectable()
export class IngredientCacheStrategy implements CacheStrategy {
  generateKey(...args: (string | number)[]): string {
    if (args.length === 0) {
      throw new Error('Ingredient cache key requires at least one argument');
    }
    return buildCacheKey(CACHE_KEY_PREFIX.INGREDIENT, ...args);
  }

  getTtl(..._keyArgs: (string | number)[]): number {
    return CACHE_TTL_INGREDIENT_SECONDS;
  }
}
