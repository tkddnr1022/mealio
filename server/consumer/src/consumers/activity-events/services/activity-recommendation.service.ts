import { Injectable } from '@nestjs/common';
import { ActivityEventType, type ActivityEventPayload } from '@mealio/shared';
import { CacheInvalidationRequestService } from 'src/consumers/cache-invalidation/cache-invalidation-request.service';
import { RecommendationRepository } from 'src/persistence/repositories/postgresql/recommendation.repository';
import { normalizeNumericId } from 'src/processing/transformation/data.normalizer';

@Injectable()
export class ActivityRecommendationService {
  constructor(
    private readonly recommendationRepository: RecommendationRepository,
    private readonly cacheInvalidationRequestService: CacheInvalidationRequestService,
  ) {}

  async apply(event: ActivityEventPayload): Promise<void> {
    const userId =
      typeof event.actor.userId === 'number' && event.actor.userId > 0
        ? event.actor.userId
        : null;

    if (userId === null) {
      return;
    }

    const recipeId = this.resolveRecipeId(event);
    if (recipeId === null) {
      return;
    }

    const delta = this.resolveDelta(event.type);
    if (delta === 0) {
      return;
    }

    await this.recommendationRepository.applyRecipeScoreDeltas(userId, [
      {
        recipeId,
        delta,
        reason: this.resolveReason(event.type),
      },
    ]);

    await this.cacheInvalidationRequestService.requestRecommendationInvalidation(
      userId,
    );
  }

  private resolveRecipeId(event: ActivityEventPayload): number | null {
    if (event.entity?.type === 'recipe') {
      return normalizeNumericId(event.entity.id, { min: 1 });
    }

    const payloadRecipeId =
      event.payload && typeof event.payload === 'object'
        ? normalizeNumericId(
            (event.payload as Record<string, unknown>).recipeId,
            {
              min: 1,
            },
          )
        : null;
    return payloadRecipeId;
  }

  private resolveDelta(type: ActivityEventType): number {
    switch (type) {
      case ActivityEventType.RECIPE_VIEW:
        return 0.1;
      case ActivityEventType.RECIPE_LIKE:
        return 0.7;
      case ActivityEventType.RECIPE_SHARE:
        return 0.4;
      case ActivityEventType.SEARCH_CLICK:
        return 0.25;
      case ActivityEventType.SEARCH_QUERY:
      default:
        return 0;
    }
  }

  private resolveReason(type: ActivityEventType): string {
    switch (type) {
      case ActivityEventType.RECIPE_VIEW:
        return '레시피 조회 행동 신호 반영';
      case ActivityEventType.RECIPE_LIKE:
        return '레시피 좋아요 행동 신호 반영';
      case ActivityEventType.RECIPE_SHARE:
        return '레시피 공유 행동 신호 반영';
      case ActivityEventType.SEARCH_CLICK:
        return '검색 클릭 행동 신호 반영';
      case ActivityEventType.SEARCH_QUERY:
      default:
        return '검색 행동 신호 반영';
    }
  }
}
