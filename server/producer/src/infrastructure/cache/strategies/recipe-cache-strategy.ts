import { Injectable } from '@nestjs/common';
import { CacheStrategy } from './cache-strategy.interface';

/**
 * Recipe 캐시 전략
 * TTL: 1시간 (3600초)
 */
@Injectable()
export class RecipeCacheStrategy implements CacheStrategy {
  private readonly KEY_PREFIX = 'recipe';
  private readonly TTL_SECONDS = 3600; // 1시간

  generateKey(...args: (string | number)[]): string {
    if (args.length === 0) {
      throw new Error('Recipe cache key requires at least one argument');
    }
    return `${this.KEY_PREFIX}:${args.join(':')}`;
  }

  getTtl(): number {
    return this.TTL_SECONDS;
  }
}
