import { Injectable } from '@nestjs/common';
import { CACHE_KEY_PREFIX } from '@cook/shared';
import { CacheStrategy } from './cache-strategy.interface';

/**
 * UserIngredient 캐시 전략
 * TTL: 30분 (1800초) - 사용자별 재료함 조회 캐싱
 */
@Injectable()
export class UserIngredientCacheStrategy implements CacheStrategy {
  private readonly TTL_SECONDS = 1800; // 30분

  generateKey(...args: (string | number)[]): string {
    if (args.length === 0) {
      throw new Error(
        'UserIngredient cache key requires at least one argument (userId)',
      );
    }
    return `${CACHE_KEY_PREFIX.USER_INGREDIENT}:${args.join(':')}`;
  }

  getTtl(): number {
    return this.TTL_SECONDS;
  }
}
