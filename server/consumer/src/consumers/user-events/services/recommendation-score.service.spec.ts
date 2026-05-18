import { Test } from '@nestjs/testing';
import { InventoryEventType } from '@mealio/shared';
import { RecommendationRepository } from 'src/persistence/repositories/postgresql/recommendation.repository';
import { RecommendationScoreService } from './recommendation-score.service';

describe('RecommendationScoreService', () => {
  it('RECIPE_FAVORITES_ADD 이벤트를 추천 점수 증가로 반영한다', async () => {
    const recommendationRepository = {
      applyRecipeScoreDeltas: jest.fn().mockResolvedValue(undefined),
      applyIngredientScoreDelta: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        RecommendationScoreService,
        {
          provide: RecommendationRepository,
          useValue: recommendationRepository,
        },
      ],
    }).compile();

    const service = module.get(RecommendationScoreService);
    await service.apply({
      type: InventoryEventType.RECIPE_FAVORITES_ADD,
      userId: 7,
      favoriteRecipeIds: [10, 11],
      timestamp: new Date().toISOString(),
    });

    expect(recommendationRepository.applyRecipeScoreDeltas).toHaveBeenCalledTimes(
      1,
    );
    expect(recommendationRepository.applyIngredientScoreDelta).not.toHaveBeenCalled();
  });

  it('FAVORITES_ADD 이벤트를 재료 기반 점수 증가로 반영한다', async () => {
    const recommendationRepository = {
      applyRecipeScoreDeltas: jest.fn().mockResolvedValue(undefined),
      applyIngredientScoreDelta: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        RecommendationScoreService,
        {
          provide: RecommendationRepository,
          useValue: recommendationRepository,
        },
      ],
    }).compile();

    const service = module.get(RecommendationScoreService);
    await service.apply({
      type: InventoryEventType.FAVORITES_ADD,
      userId: 3,
      favoriteIngredientIds: [1, 2],
      timestamp: new Date().toISOString(),
    });

    expect(
      recommendationRepository.applyIngredientScoreDelta,
    ).toHaveBeenCalledWith(
      3,
      [1, 2],
      0.8,
      '관심 재료 추가 신호 반영',
    );
  });
});
