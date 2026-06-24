import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mealio/shared';
import { Prisma } from '@mealio/shared/prisma-client';

export interface IngredientEmbeddingUpsertInput {
  ingredientId: number;
  embedding: number[];
  embeddingModel: string;
}

export interface IngredientVectorSearchResult {
  ingredientId: number;
  score: number;
}

/**
 * Consumer 전용 IngredientEmbedding 리포지토리
 */
@Injectable()
export class IngredientEmbeddingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(input: IngredientEmbeddingUpsertInput): Promise<void> {
    const vectorLiteral = this.toVectorLiteral(input.embedding);
    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "IngredientEmbedding" (
        "ingredient_id",
        "embedding",
        "embedding_model",
        "version"
      )
      VALUES ($1, $2::vector, $3, 1)
      ON CONFLICT ("ingredient_id")
      DO UPDATE SET
        "embedding" = EXCLUDED."embedding",
        "embedding_model" = EXCLUDED."embedding_model",
        "version" = "IngredientEmbedding"."version" + 1,
        "updated_at" = CURRENT_TIMESTAMP
      `,
      input.ingredientId,
      vectorLiteral,
      input.embeddingModel,
    );
  }

  async findMissingIds(ingredientIds: number[]): Promise<number[]> {
    const uniqueIngredientIds = [...new Set(ingredientIds)].filter(
      (id) => id > 0,
    );
    if (uniqueIngredientIds.length === 0) {
      return [];
    }
    const existingRows = await this.prisma.$queryRaw<
      Array<{ ingredientId: number }>
    >`
      SELECT ingredient_id as "ingredientId"
      FROM "IngredientEmbedding"
      WHERE ingredient_id IN (${Prisma.join(uniqueIngredientIds)})
    `;
    const existingIdSet = new Set(existingRows.map((row) => row.ingredientId));
    return uniqueIngredientIds.filter((id) => !existingIdSet.has(id));
  }

  async searchTopK(
    tx: Prisma.TransactionClient,
    queryEmbedding: number[],
    topK: number,
    threshold: number,
  ): Promise<IngredientVectorSearchResult[]> {
    if (queryEmbedding.length === 0 || topK <= 0) {
      return [];
    }
    const vectorLiteral = this.toVectorLiteral(queryEmbedding);
    return tx.$queryRawUnsafe<IngredientVectorSearchResult[]>(
      `
      SELECT
        ie.ingredient_id as "ingredientId",
        GREATEST(0, LEAST(1, 1 - (ie.embedding <=> $1::vector))) as "score"
      FROM "IngredientEmbedding" ie
      WHERE (1 - (ie.embedding <=> $1::vector)) >= $2
      ORDER BY ie.embedding <=> $1::vector ASC
      LIMIT $3
      `,
      vectorLiteral,
      threshold,
      topK,
    );
  }

  private toVectorLiteral(values: number[]): string {
    const sanitized = values
      .map((value) => (Number.isFinite(value) ? value : 0))
      .map((value) => Number(value.toFixed(8)));
    return `[${sanitized.join(',')}]`;
  }
}
