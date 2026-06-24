import { Injectable } from '@nestjs/common';
import { IngredientEmbeddingRepository } from 'src/persistence/repositories/postgresql/ingredient-embedding.repository';
import { RecipeIngredientRepository } from 'src/persistence/repositories/postgresql/recipe-ingredient.repository';

export interface IngredientEmbeddingDocument {
  ingredientId: number;
  documentText: string;
}

@Injectable()
export class IngredientEmbeddingDocumentService {
  constructor(
    private readonly recipeIngredientRepository: RecipeIngredientRepository,
    private readonly ingredientEmbeddingRepository: IngredientEmbeddingRepository,
  ) {}

  async buildDocumentsByRecipeId(
    recipeId: number,
    queuedIngredientIdSet: Set<number>,
  ): Promise<IngredientEmbeddingDocument[]> {
    const candidates =
      await this.recipeIngredientRepository.findIngredientNameCandidatesByRecipeId(
        recipeId,
      );
    const unqueuedCandidates = candidates.filter(
      (candidate) => !queuedIngredientIdSet.has(candidate.ingredientId),
    );
    if (unqueuedCandidates.length === 0) {
      return [];
    }

    const missingIngredientIds =
      await this.ingredientEmbeddingRepository.findMissingIds(
        unqueuedCandidates.map((candidate) => candidate.ingredientId),
      );
    if (missingIngredientIds.length === 0) {
      return [];
    }

    const missingIngredientIdSet = new Set(missingIngredientIds);
    const documents: IngredientEmbeddingDocument[] = [];
    for (const candidate of unqueuedCandidates) {
      if (!missingIngredientIdSet.has(candidate.ingredientId)) {
        continue;
      }
      const documentText = candidate.ingredientName.trim();
      if (documentText.length === 0) {
        continue;
      }
      queuedIngredientIdSet.add(candidate.ingredientId);
      documents.push({
        ingredientId: candidate.ingredientId,
        documentText,
      });
    }
    return documents;
  }
}
