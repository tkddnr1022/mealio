import { Test } from '@nestjs/testing';
import {
  CacheInvalidationEventType,
  cacheKeyRecipeCategories,
  cacheKeyRecipeDetail,
  cacheKeyIngredientCategories,
  cachePatternRecipeInvalidation,
  cachePatternIngredientInvalidation,
} from '@mealio/shared';
import { RedisService } from '@mealio/shared';
import { RedisInvalidationHandler } from './redis-invalidation.handler';

describe('RedisInvalidationHandler', () => {
  let handler: RedisInvalidationHandler;
  let redisService: {
    del: jest.Mock;
    delByPattern: jest.Mock;
  };

  beforeEach(async () => {
    redisService = {
      del: jest.fn().mockResolvedValue(undefined),
      delByPattern: jest.fn().mockResolvedValue(1),
    };

    const module = await Test.createTestingModule({
      providers: [
        RedisInvalidationHandler,
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    handler = module.get(RedisInvalidationHandler);
  });

  it('RECIPE 무효화 시 상세·categories·list/search/static-ids 패턴을 삭제한다', async () => {
    const { patterns, singleKeys } = cachePatternRecipeInvalidation();

    await handler.execute({
      type: CacheInvalidationEventType.RECIPE,
      recipeIds: [1, 2, 1],
    });

    expect(redisService.del).toHaveBeenCalledWith(cacheKeyRecipeDetail(1));
    expect(redisService.del).toHaveBeenCalledWith(cacheKeyRecipeDetail(2));
    expect(redisService.del).toHaveBeenCalledWith(cacheKeyRecipeCategories());
    expect(redisService.del).toHaveBeenCalledTimes(3);

    for (const pattern of patterns) {
      expect(redisService.delByPattern).toHaveBeenCalledWith(pattern);
    }
    expect(redisService.delByPattern).toHaveBeenCalledTimes(patterns.length);

    for (const key of singleKeys) {
      expect(redisService.del).toHaveBeenCalledWith(key);
    }
  });

  it('INGREDIENT 무효화 시 list/search 패턴·categories 키를 삭제한다', async () => {
    const { patterns, singleKeys } = cachePatternIngredientInvalidation();

    await handler.execute({
      type: CacheInvalidationEventType.INGREDIENT,
    });

    expect(redisService.del).toHaveBeenCalledWith(
      cacheKeyIngredientCategories(),
    );
    for (const pattern of patterns) {
      expect(redisService.delByPattern).toHaveBeenCalledWith(pattern);
    }
    for (const key of singleKeys) {
      expect(redisService.del).toHaveBeenCalledWith(key);
    }
  });
});
