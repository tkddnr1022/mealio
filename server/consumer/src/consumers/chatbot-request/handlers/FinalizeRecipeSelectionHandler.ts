import { Injectable } from '@nestjs/common';
import type { SearchedRecipe } from './SearchRecipesHandler';

export interface FinalizeSelectionPayload {
  selectedRecipeIds?: number[];
}

@Injectable()
export class FinalizeRecipeSelectionHandler {
  execute(
    payload: FinalizeSelectionPayload,
    candidates: SearchedRecipe[],
  ): SearchedRecipe[] {
    if (!Array.isArray(payload.selectedRecipeIds) || candidates.length === 0) {
      return [];
    }

    const uniqueIds = [...new Set(payload.selectedRecipeIds)]
      .filter((id) => Number.isInteger(id) && id > 0)
      .slice(0, 5);
    if (uniqueIds.length === 0) {
      return [];
    }

    const candidateById = new Map(candidates.map((recipe) => [recipe.id, recipe]));
    return uniqueIds
      .map((id) => candidateById.get(id))
      .filter((recipe): recipe is SearchedRecipe => recipe !== undefined);
  }
}
