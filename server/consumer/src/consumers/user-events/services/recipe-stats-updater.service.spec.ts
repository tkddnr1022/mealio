import { Test } from '@nestjs/testing';
import { InventoryEventType } from '@cook/shared';
import { RecipeRepository } from 'src/persistence/repositories/postgresql/recipe.repository';
import { RecipeStatsUpdaterService } from './recipe-stats-updater.service';

describe('RecipeStatsUpdaterService', () => {
  it('RECIPE_FAVORITES_ADD 이벤트에서 likeCount 증가만 수행한다', async () => {
    const recipeRepository = {
      incrementLikeCount: jest.fn().mockResolvedValue(undefined),
      initializeStatsIfMissing: jest.fn().mockResolvedValue(undefined),
      decrementLikeCount: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        RecipeStatsUpdaterService,
        { provide: RecipeRepository, useValue: recipeRepository },
      ],
    }).compile();
    const service = module.get(RecipeStatsUpdaterService);

    await service.apply({
      type: InventoryEventType.RECIPE_FAVORITES_ADD,
      userId: 1,
      favoriteRecipeIds: [11, 22],
      timestamp: new Date().toISOString(),
    });

    expect(recipeRepository.incrementLikeCount).toHaveBeenCalledTimes(2);
    expect(recipeRepository.incrementLikeCount).toHaveBeenCalledWith(11);
    expect(recipeRepository.incrementLikeCount).toHaveBeenCalledWith(22);
  });

  it('RECIPE_FAVORITES_REMOVE 이벤트에서 0 미만 방지 감소만 수행한다', async () => {
    const recipeRepository = {
      incrementLikeCount: jest.fn().mockResolvedValue(undefined),
      initializeStatsIfMissing: jest.fn().mockResolvedValue(undefined),
      decrementLikeCount: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        RecipeStatsUpdaterService,
        { provide: RecipeRepository, useValue: recipeRepository },
      ],
    }).compile();
    const service = module.get(RecipeStatsUpdaterService);

    await service.apply({
      type: InventoryEventType.RECIPE_FAVORITES_REMOVE,
      userId: 1,
      recipeId: 11,
      timestamp: new Date().toISOString(),
    });

    expect(recipeRepository.initializeStatsIfMissing).toHaveBeenCalledWith(11);
    expect(recipeRepository.decrementLikeCount).toHaveBeenCalledWith(11);
  });
});

