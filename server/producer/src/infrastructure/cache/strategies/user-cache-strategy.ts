import { Injectable } from '@nestjs/common';
import { CACHE_KEY_PREFIX, buildCacheKey } from '@mealio/shared';
import { CACHE_TTL_USER_PROFILE_SECONDS } from '../../../policy/cache.policy';
import { CacheStrategy } from './cache-strategy.interface';

/**
 * User 캐시 전략
 * TTL: 5분 (300초)
 */
@Injectable()
export class UserCacheStrategy implements CacheStrategy {
  generateKey(...args: (string | number)[]): string {
    if (args.length === 0) {
      throw new Error('User cache key requires at least one argument');
    }
    return buildCacheKey(CACHE_KEY_PREFIX.USER, ...args);
  }

  getTtl(..._keyArgs: (string | number)[]): number {
    return CACHE_TTL_USER_PROFILE_SECONDS;
  }
}
