import { Injectable } from '@nestjs/common';
import { CACHE_KEY_PREFIX, buildCacheKey } from '@mealio/shared';
import {
  CACHE_TTL_RECIPE_DETAIL_SECONDS,
  CACHE_TTL_RECIPE_LIST_SECONDS,
} from '../../../policy/cache.policy';
import { CacheStrategy } from './cache-strategy.interface';

/**
 * Recipe 캐시 전략
 * - 상세(`recipe:{id}`): 15분
 * - 목록·검색·카테고리·static-ids: 5분
 */
@Injectable()
export class RecipeCacheStrategy implements CacheStrategy {
  generateKey(...args: (string | number)[]): string {
    if (args.length === 0) {
      throw new Error('Recipe cache key requires at least one argument');
    }
    return buildCacheKey(CACHE_KEY_PREFIX.RECIPE, ...args);
  }

  getTtl(...keyArgs: (string | number)[]): number {
    if (keyArgs.length === 1 && typeof keyArgs[0] === 'number') {
      return CACHE_TTL_RECIPE_DETAIL_SECONDS;
    }
    return CACHE_TTL_RECIPE_LIST_SECONDS;
  }
}
