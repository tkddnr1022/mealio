import { Injectable } from '@nestjs/common';
import { CACHE_KEY_PREFIX, buildCacheKey } from '@mealio/shared';
import { CacheStrategy } from './cache-strategy.interface';

/**
 * Ingredient 캐시 전략
 * TTL: 24시간 (86400초)
 */
@Injectable()
export class IngredientCacheStrategy implements CacheStrategy {
  private readonly TTL_SECONDS = 86400; // 24시간

  generateKey(...args: (string | number)[]): string {
    if (args.length === 0) {
      throw new Error('Ingredient cache key requires at least one argument');
    }
    return buildCacheKey(CACHE_KEY_PREFIX.INGREDIENT, ...args);
  }

  getTtl(): number {
    return this.TTL_SECONDS;
  }
}
