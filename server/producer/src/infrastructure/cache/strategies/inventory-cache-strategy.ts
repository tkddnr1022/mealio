import { Injectable } from '@nestjs/common';
import { CACHE_KEY_PREFIX, buildCacheKey } from '@mealio/shared';
import { CACHE_TTL_INVENTORY_SECONDS } from '../../../policy/cache.policy';
import { CacheStrategy } from './cache-strategy.interface';

/**
 * Inventory 캐시 전략
 * TTL: 5분 (300초) - 사용자별 재료함 조회 캐싱
 */
@Injectable()
export class InventoryCacheStrategy implements CacheStrategy {
  generateKey(...args: (string | number)[]): string {
    if (args.length === 0) {
      throw new Error(
        'Inventory cache key requires at least one argument (userId)',
      );
    }
    return buildCacheKey(CACHE_KEY_PREFIX.INVENTORY, ...args);
  }

  getTtl(..._keyArgs: (string | number)[]): number {
    return CACHE_TTL_INVENTORY_SECONDS;
  }
}
