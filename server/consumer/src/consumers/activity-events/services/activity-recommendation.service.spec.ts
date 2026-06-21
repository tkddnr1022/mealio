import { Test } from '@nestjs/testing';
import { ActivityEventType } from '@mealio/shared';
import { CacheInvalidationRequestService } from 'src/consumers/cache-invalidation/cache-invalidation-request.service';
import { RecommendationRepository } from 'src/persistence/repositories/postgresql/recommendation.repository';
import { ActivityRecommendationService } from './activity-recommendation.service';

describe('ActivityRecommendationService', () => {
  it('로그인 사용자의 recipe.view 이벤트를 점수에 반영하고 추천 캐시를 무효화한다', async () => {
    const recommendationRepository = {
      applyRecipeScoreDeltas: jest.fn().mockResolvedValue(undefined),
    };
    const cacheInvalidationRequestService = {
      requestRecommendationInvalidation: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        ActivityRecommendationService,
        {
          provide: RecommendationRepository,
          useValue: recommendationRepository,
        },
        {
          provide: CacheInvalidationRequestService,
          useValue: cacheInvalidationRequestService,
        },
      ],
    }).compile();
    const service = module.get(ActivityRecommendationService);

    await service.apply({
      type: ActivityEventType.RECIPE_VIEW,
      actor: { type: 'user', userId: 12 },
      entity: { type: 'recipe', id: 99 },
    });

    expect(
      recommendationRepository.applyRecipeScoreDeltas,
    ).toHaveBeenCalledTimes(1);
    expect(
      cacheInvalidationRequestService.requestRecommendationInvalidation,
    ).toHaveBeenCalledWith(12);
  });

  it('비로그인 사용자 이벤트는 추천 점수를 갱신하지 않는다', async () => {
    const recommendationRepository = {
      applyRecipeScoreDeltas: jest.fn().mockResolvedValue(undefined),
    };
    const cacheInvalidationRequestService = {
      requestRecommendationInvalidation: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        ActivityRecommendationService,
        {
          provide: RecommendationRepository,
          useValue: recommendationRepository,
        },
        {
          provide: CacheInvalidationRequestService,
          useValue: cacheInvalidationRequestService,
        },
      ],
    }).compile();
    const service = module.get(ActivityRecommendationService);

    await service.apply({
      type: ActivityEventType.RECIPE_VIEW,
      actor: { type: 'user' },
      entity: { type: 'recipe', id: 99 },
    });

    expect(
      recommendationRepository.applyRecipeScoreDeltas,
    ).not.toHaveBeenCalled();
    expect(
      cacheInvalidationRequestService.requestRecommendationInvalidation,
    ).not.toHaveBeenCalled();
  });
});
