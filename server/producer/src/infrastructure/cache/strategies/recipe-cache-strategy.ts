import { Injectable } from '@nestjs/common';
import { CACHE_KEY_PREFIX, buildCacheKey } from '@cook/shared';
import { CacheStrategy } from './cache-strategy.interface';

/**
 * Recipe 캐시 전략
 * TTL: 30분 (1800초)
 */
@Injectable()
export class RecipeCacheStrategy implements CacheStrategy {
  private readonly TTL_SECONDS = 1800; // 30분

  generateKey(...args: (string | number)[]): string {
    if (args.length === 0) {
      throw new Error('Recipe cache key requires at least one argument');
    }
    return buildCacheKey(CACHE_KEY_PREFIX.RECIPE, ...args);
  }

  getTtl(): number {
    return this.TTL_SECONDS;
  }
}
