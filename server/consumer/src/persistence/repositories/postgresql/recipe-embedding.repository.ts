import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mealio/shared';
import { Prisma } from '@mealio/shared/prisma-client';

export interface EmbeddingUpsertInput {
  recipeId: number;
  embedding: number[];
  embeddingModel: string;
}

export interface RecipeSemanticScore {
  recipeId: number;
  semanticScore: number;
}

export interface SemanticTopKSearchInput {
  queryEmbedding: number[];
  limit: number;
  excludeIngredientIds?: number[];
}

@Injectable()
export class RecipeEmbeddingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findExisting(
    recipeIds: number[],
  ): Promise<Map<number, { version: number }>> {
    const uniqueRecipeIds = [...new Set(recipeIds)].filter((id) => id > 0);
    if (uniqueRecipeIds.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ recipeId: number; version: number }>
    >`
      SELECT
        recipe_id as "recipeId",
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
        "embedding_model",
        "version"
      )
      VALUES ($1, $2::vector, $3, 1)
      ON CONFLICT ("recipe_id")
      DO UPDATE SET
        "embedding" = EXCLUDED."embedding",
        "embedding_model" = EXCLUDED."embedding_model",
        "version" = "RecipeEmbedding"."version" + 1,
        "updated_at" = CURRENT_TIMESTAMP
      `,
      input.recipeId,
      vectorLiteral,
      input.embeddingModel,
    );
  }

  /**
   * 전체 RecipeEmbedding 코퍼스에서 ANN top-K 검색.
   * isPublished 하드 제약과 기피 재료 ID 제외를 SQL 레벨에서 적용한다.
   */
  async searchTopK(
    input: SemanticTopKSearchInput,
  ): Promise<RecipeSemanticScore[]> {
    if (input.queryEmbedding.length === 0 || input.limit <= 0) {
      return [];
    }

    const vectorLiteral = this.toVectorLiteral(input.queryEmbedding);
    const excludeIds = [
      ...new Set((input.excludeIngredientIds ?? []).filter((id) => id > 0)),
    ];

    if (excludeIds.length === 0) {
      return this.prisma.$queryRawUnsafe<RecipeSemanticScore[]>(
        `
        SELECT
          re.recipe_id as "recipeId",
          GREATEST(0, LEAST(1, 1 - (re.embedding <=> $1::vector))) as "semanticScore"
        FROM "RecipeEmbedding" re
        INNER JOIN "Recipe" r ON r.id = re.recipe_id AND r.is_published = true
        ORDER BY re.embedding <=> $1::vector ASC
        LIMIT $2
        `,
        vectorLiteral,
        input.limit,
      );
    }

    return this.prisma.$queryRawUnsafe<RecipeSemanticScore[]>(
      `
      SELECT
        re.recipe_id as "recipeId",
        GREATEST(0, LEAST(1, 1 - (re.embedding <=> $1::vector))) as "semanticScore"
      FROM "RecipeEmbedding" re
      INNER JOIN "Recipe" r ON r.id = re.recipe_id AND r.is_published = true
      WHERE re.recipe_id NOT IN (
        SELECT ri.recipe_id
        FROM "RecipeIngredient" ri
        WHERE ri.ingredient_id = ANY($2::int[])
      )
      ORDER BY re.embedding <=> $1::vector ASC
      LIMIT $3
      `,
      vectorLiteral,
      excludeIds,
      input.limit,
    );
  }

  private toVectorLiteral(values: number[]): string {
    const sanitized = values
      .map((value) => (Number.isFinite(value) ? value : 0))
      .map((value) => Number(value.toFixed(8)));
    return `[${sanitized.join(',')}]`;
  }
}
