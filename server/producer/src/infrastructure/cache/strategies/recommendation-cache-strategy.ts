import { Injectable } from '@nestjs/common';
import { cacheKeyRecommendation } from '@mealio/shared';
import { CACHE_TTL_RECOMMENDATION_SECONDS } from '../../../policy/cache.policy';
import { CacheStrategy } from './cache-strategy.interface';

@Injectable()
export class RecommendationCacheStrategy implements CacheStrategy {
  generateKey(...args: (string | number)[]): string {
    if (args.length !== 1 || typeof args[0] !== 'number') {
      throw new Error(
        'Recommendation cache key requires exactly one numeric userId',
      );
    }
    return cacheKeyRecommendation(args[0]);
  }

  getTtl(..._keyArgs: (string | number)[]): number {
    return CACHE_TTL_RECOMMENDATION_SECONDS;
  }
}
