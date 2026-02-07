import { Injectable } from '@nestjs/common';
import { CACHE_KEY_PREFIX } from '@cook/shared';
import { CacheStrategy } from './cache-strategy.interface';

/**
 * User 캐시 전략
 * TTL: 30분 (1800초)
 */
@Injectable()
export class UserCacheStrategy implements CacheStrategy {
  private readonly TTL_SECONDS = 1800; // 30분

  generateKey(...args: (string | number)[]): string {
    if (args.length === 0) {
      throw new Error('User cache key requires at least one argument');
    }
    return `${CACHE_KEY_PREFIX.USER}:${args.join(':')}`;
  }

  getTtl(): number {
    return this.TTL_SECONDS;
  }
}
