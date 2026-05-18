import { Injectable } from '@nestjs/common';
import {
  InventoryEventType,
  type InventoryEvent,
  type UserEvent,
  UserEventType,
} from '@mealio/shared';
import { RecommendationRepository } from 'src/persistence/repositories/postgresql/recommendation.repository';

export type UserEventPayload = UserEvent | InventoryEvent;

@Injectable()
export class RecommendationScoreService {
  constructor(
    private readonly recommendationRepository: RecommendationRepository,
  ) {}

  async apply(event: UserEventPayload): Promise<void> {
    if (event.userId <= 0) {
      return;
    }

    if (
      event.type === UserEventType.SIGNUP ||
      event.type === UserEventType.LOGIN
    ) {
      return;
    }

    switch (event.type) {
      case UserEventType.NICKNAME_UPDATE:
        return;
      case InventoryEventType.UPDATE:
        await this.recommendationRepository.applyIngredientScoreDelta(
          event.userId,
          event.ownedIngredientIds,
          0.15,
          '보유 재료 업데이트 신호 반영',
        );
        return;
      case InventoryEventType.ADD:
        await this.recommendationRepository.applyIngredientScoreDelta(
          event.userId,
          event.ownedIngredientIds,
          0.25,
          '보유 재료 추가 신호 반영',
        );
        return;
      case InventoryEventType.REMOVE:
        await this.recommendationRepository.applyIngredientScoreDelta(
          event.userId,
          [event.ingredientId],
          -0.2,
          '보유 재료 제거 신호 반영',
        );
        return;
      case InventoryEventType.FAVORITES_UPDATE:
        await this.recommendationRepository.applyIngredientScoreDelta(
          event.userId,
          event.favoriteIngredientIds,
          0.5,
          '관심 재료 업데이트 신호 반영',
        );
        return;
      case InventoryEventType.FAVORITES_ADD:
        await this.recommendationRepository.applyIngredientScoreDelta(
          event.userId,
          event.favoriteIngredientIds,
          0.8,
          '관심 재료 추가 신호 반영',
        );
        return;
      case InventoryEventType.FAVORITES_REMOVE:
        await this.recommendationRepository.applyIngredientScoreDelta(
          event.userId,
          [event.ingredientId],
          -0.8,
          '관심 재료 제거 신호 반영',
        );
        return;
      case InventoryEventType.RECIPE_FAVORITES_ADD:
        await this.recommendationRepository.applyRecipeScoreDeltas(
          event.userId,
          event.favoriteRecipeIds.map((recipeId) => ({
            recipeId,
            delta: 1.8,
            reason: '관심 레시피 추가 신호 반영',
          })),
        );
        return;
      case InventoryEventType.RECIPE_FAVORITES_REMOVE:
        await this.recommendationRepository.applyRecipeScoreDeltas(
          event.userId,
          [
            {
              recipeId: event.recipeId,
              delta: -1.8,
              reason: '관심 레시피 제거 신호 반영',
            },
          ],
        );
        return;
    }
  }
}
