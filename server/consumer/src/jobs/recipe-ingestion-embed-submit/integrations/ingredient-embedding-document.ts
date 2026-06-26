import { Injectable } from '@nestjs/common';
import { IngredientEmbeddingRepository } from 'src/persistence/repositories/postgresql/ingredient-embedding.repository';
import { IngredientRepository } from 'src/persistence/repositories/postgresql/ingredient.repository';

export interface IngredientEmbeddingDocument {
  ingredientId: number;
  documentText: string;
}

@Injectable()
export class IngredientEmbeddingDocumentService {
  constructor(
    private readonly ingredientRepository: IngredientRepository,
    private readonly ingredientEmbeddingRepository: IngredientEmbeddingRepository,
  ) {}

  async buildDocumentsByIngredientIds(
    ingredientIds: number[],
    queuedIngredientIdSet: Set<number>,
  ): Promise<IngredientEmbeddingDocument[]> {
    const unqueued = ingredientIds.filter(
      (id) => !queuedIngredientIdSet.has(id),
    );
    if (unqueued.length === 0) {
      return [];
    }

    const missingIds =
      await this.ingredientEmbeddingRepository.findMissingIds(unqueued);
    if (missingIds.length === 0) {
      return [];
    }

    const nameRows =
      await this.ingredientRepository.findManyNamesByIds(missingIds);
    const documents: IngredientEmbeddingDocument[] = [];
    for (const row of nameRows) {
      const documentText = row.name.trim();
      if (documentText.length === 0) {
        continue;
      }
      queuedIngredientIdSet.add(row.id);
      documents.push({
        ingredientId: row.id,
        documentText,
      });
    }
    return documents;
  }
}
