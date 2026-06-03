import { Injectable } from '@nestjs/common';
import { CACHE_KEY_PREFIX, buildCacheKey } from '@mealio/shared';
import { CacheStrategy } from './cache-strategy.interface';

/** list/search/categories/static-ids 등 목록형 세그먼트 TTL (5분) */
const RECIPE_LIST_TTL_SECONDS = 300;
/** 상세 `recipe:{id}` TTL (15분) */
const RECIPE_DETAIL_TTL_SECONDS = 900;

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
      return RECIPE_DETAIL_TTL_SECONDS;
    }
    return RECIPE_LIST_TTL_SECONDS;
  }
}
