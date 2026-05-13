import { Injectable } from '@nestjs/common';
import { InventoryEventType, type InventoryEvent } from '@mealio/shared';
import { RecipeRepository } from 'src/persistence/repositories/postgresql/recipe.repository';
// TODO: likeCount 중복 증가 방지 로직 검토
@Injectable()
export class RecipeStatsUpdaterService {
  constructor(private readonly recipeRepository: RecipeRepository) {}

  async apply(event: InventoryEvent): Promise<void> {
    switch (event.type) {
      case InventoryEventType.RECIPE_FAVORITES_ADD: {
        for (const recipeId of event.favoriteRecipeIds) {
          await this.recipeRepository.incrementLikeCount(recipeId);
        }
        break;
      }
      case InventoryEventType.RECIPE_FAVORITES_REMOVE: {
        await this.recipeRepository.initializeStatsIfMissing(event.recipeId);
        await this.recipeRepository.decrementLikeCount(event.recipeId);
        break;
      }
      default:
        break;
    }
  }
}
