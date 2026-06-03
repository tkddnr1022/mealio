import { Injectable } from '@nestjs/common';
import { cacheKeyRecommendation } from '@mealio/shared';
import { CacheStrategy } from './cache-strategy.interface';

@Injectable()
export class RecommendationCacheStrategy implements CacheStrategy {
  private readonly TTL_SECONDS = 3600; // 1시간

  generateKey(...args: (string | number)[]): string {
    if (args.length !== 1 || typeof args[0] !== 'number') {
      throw new Error(
        'Recommendation cache key requires exactly one numeric userId',
      );
    }
    return cacheKeyRecommendation(args[0]);
  }

  getTtl(..._keyArgs: (string | number)[]): number {
    return this.TTL_SECONDS;
  }
}
