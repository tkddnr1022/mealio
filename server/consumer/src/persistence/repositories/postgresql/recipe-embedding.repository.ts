import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mealio/shared';
import { Prisma } from '@mealio/shared/prisma-client';

export interface EmbeddingUpsertInput {
  recipeId: number;
  embedding: number[];
  documentText: string;
  embeddingModel: string;
  sourceUpdatedAt: Date;
}

export interface RecipeSemanticScore {
  recipeId: number;
  semanticScore: number;
}

@Injectable()
export class RecipeEmbeddingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findExisting(
    recipeIds: number[],
  ): Promise<Map<number, { sourceUpdatedAt: Date; version: number }>> {
    const uniqueRecipeIds = [...new Set(recipeIds)].filter((id) => id > 0);
    if (uniqueRecipeIds.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ recipeId: number; sourceUpdatedAt: Date; version: number }>
    >`
      SELECT
        recipe_id as "recipeId",
        source_updated_at as "sourceUpdatedAt",
        version as "version"
      FROM "RecipeEmbedding"
      WHERE recipe_id IN (${Prisma.join(uniqueRecipeIds)})
    `;
    return new Map(rows.map((row) => [row.recipeId, row]));
  }

  async upsert(input: EmbeddingUpsertInput): Promise<void> {
    const vectorLiteral = this.toVectorLiteral(input.embedding);
    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "RecipeEmbedding" (
        "recipe_id",
        "embedding",
        "document_text",
        "embedding_model",
        "version",
        "source_updated_at"
      )
      VALUES ($1, $2::vector, $3, $4, 1, $5)
      ON CONFLICT ("recipe_id")
      DO UPDATE SET
        "embedding" = EXCLUDED."embedding",
        "document_text" = EXCLUDED."document_text",
        "embedding_model" = EXCLUDED."embedding_model",
        "version" = "RecipeEmbedding"."version" + 1,
        "source_updated_at" = EXCLUDED."source_updated_at",
        "updated_at" = CURRENT_TIMESTAMP
      `,
      input.recipeId,
      vectorLiteral,
      input.documentText,
      input.embeddingModel,
      input.sourceUpdatedAt,
    );
  }

  async searchByRecipeIds(
    recipeIds: number[],
    queryEmbedding: number[],
  ): Promise<RecipeSemanticScore[]> {
    const uniqueRecipeIds = [...new Set(recipeIds)].filter((id) => id > 0);
    if (uniqueRecipeIds.length === 0) {
      return [];
    }

    const vectorLiteral = this.toVectorLiteral(queryEmbedding);
    return this.prisma.$queryRawUnsafe<RecipeSemanticScore[]>(
      `
      SELECT
        recipe_id as "recipeId",
        GREATEST(0, LEAST(1, 1 - (embedding <=> $1::vector))) as "semanticScore"
      FROM "RecipeEmbedding"
      WHERE recipe_id IN (${uniqueRecipeIds.join(',')})
      ORDER BY embedding <=> $1::vector ASC
      `,
      vectorLiteral,
    );
  }

  private toVectorLiteral(values: number[]): string {
    const sanitized = values
      .map((value) => (Number.isFinite(value) ? value : 0))
      .map((value) => Number(value.toFixed(8)));
    return `[${sanitized.join(',')}]`;
  }
}
