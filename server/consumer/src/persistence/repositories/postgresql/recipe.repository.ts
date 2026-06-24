import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mealio/shared';
import { Prisma } from '@mealio/shared/prisma-client';

export interface RecipeForEmbeddingDocument {
  id: number;
  title: string;
  description: string | null;
  instructions: unknown;
  cookTime: number;
  difficulty: number;
  servings: number;
  cookingMethod: string | null;
  dishType: string | null;
  nutrition: unknown;
  cookingTip: string | null;
  updatedAt: Date;
  categoryMeta: { key: string; name: string };
  recipeIngredients: Array<{
    ingredient: {
      id: number;
      name: string;
      categoryMeta: { key: string; name: string };
    };
    amount: unknown;
    unit: string | null;
    isOptional: boolean;
  }>;
}

export interface RecipeIngestionUpsertInput {
  categoryId: number;
  title: string;
  description: string | null;
  instructions: Prisma.InputJsonValue;
  difficulty: number;
  cookTime: number;
  servings: number;
  imageUrl: string | null;
  nutrition: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  cookingMethod: string | null;
  dishType: string | null;
  cookingTip: string | null;
  source: string;
  sourceRecipeId: string;
  isPublished: boolean;
}

/**
 * Consumer 전용 Recipe 리포지토리
 */
@Injectable()
export class RecipeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async runInTransaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  async findIdBySource(
    source: string,
    sourceRecipeId: string,
  ): Promise<number | null> {
    const row = await this.prisma.recipe.findUnique({
      where: {
        source_sourceRecipeId: {
          source,
          sourceRecipeId,
        },
      },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  async findForEmbeddingDocument(
    recipeId: number,
  ): Promise<RecipeForEmbeddingDocument | null> {
    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      return null;
    }
    return this.prisma.recipe.findUnique({
      where: { id: recipeId },
      select: {
        id: true,
        title: true,
        description: true,
        instructions: true,
        cookTime: true,
        difficulty: true,
        servings: true,
        cookingMethod: true,
        dishType: true,
        nutrition: true,
        cookingTip: true,
        updatedAt: true,
        categoryMeta: { select: { key: true, name: true } },
        recipeIngredients: {
          select: {
            amount: true,
            unit: true,
            isOptional: true,
            ingredient: {
              select: {
                id: true,
                name: true,
                categoryMeta: { select: { key: true, name: true } },
              },
            },
          },
        },
      },
    });
  }

  async findBySourceInTx(
    tx: Prisma.TransactionClient,
    source: string,
    sourceRecipeId: string,
  ): Promise<{ id: number } | null> {
    return tx.recipe.findUnique({
      where: {
        source_sourceRecipeId: {
          source,
          sourceRecipeId,
        },
      },
      select: { id: true },
    });
  }

  async upsertForIngestionInTx(
    tx: Prisma.TransactionClient,
    input: RecipeIngestionUpsertInput,
  ): Promise<{ id: number }> {
    const existing = await tx.recipe.findUnique({
      where: {
        source_sourceRecipeId: {
          source: input.source,
          sourceRecipeId: input.sourceRecipeId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return tx.recipe.update({
        where: { id: existing.id },
        data: input,
        select: { id: true },
      });
    }

    return tx.recipe.create({
      data: input,
      select: { id: true },
    });
  }

  async initializeStatsInTx(
    tx: Prisma.TransactionClient,
    recipeId: number,
  ): Promise<void> {
    await tx.recipeStats.upsert({
      where: { recipeId },
      create: {
        recipeId,
        viewCount: 0,
        likeCount: 0,
      },
      update: {},
    });
  }

  async incrementViewCount(recipeId: number): Promise<void> {
    await this.prisma.recipeStats.upsert({
      where: { recipeId },
      create: {
        recipeId,
        viewCount: 1,
        likeCount: 0,
      },
      update: { viewCount: { increment: 1 } },
    });
  }

  async incrementLikeCount(recipeId: number): Promise<void> {
    await this.prisma.recipeStats.upsert({
      where: { recipeId },
      create: {
        recipeId,
        viewCount: 0,
        likeCount: 1,
      },
      update: { likeCount: { increment: 1 } },
    });
  }

  async decrementLikeCount(recipeId: number): Promise<void> {
    await this.prisma.recipeStats.updateMany({
      where: {
        recipeId,
        likeCount: { gt: 0 },
      },
      data: {
        likeCount: { decrement: 1 },
      },
    });
  }

  async initializeStatsIfMissing(recipeId: number): Promise<void> {
    await this.prisma.recipeStats.upsert({
      where: { recipeId },
      create: {
        recipeId,
        viewCount: 0,
        likeCount: 0,
      },
      update: {},
    });
  }
}
