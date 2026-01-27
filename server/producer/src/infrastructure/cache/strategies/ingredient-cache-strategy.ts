import { Injectable } from '@nestjs/common';
import { CacheStrategy } from './cache-strategy.interface';

/**
 * Ingredient 캐시 전략
 * TTL: 24시간 (86400초)
 */
@Injectable()
export class IngredientCacheStrategy implements CacheStrategy {
  private readonly KEY_PREFIX = 'ingredient';
  private readonly TTL_SECONDS = 86400; // 24시간

  generateKey(...args: (string | number)[]): string {
    if (args.length === 0) {
      throw new Error('Ingredient cache key requires at least one argument');
    }
    return `${this.KEY_PREFIX}:${args.join(':')}`;
  }

  getTtl(): number {
    return this.TTL_SECONDS;
  }
}
