import { Injectable } from '@nestjs/common';
import {
  RECIPE_INGESTION_DEFAULT_INGREDIENT_CATEGORY_ID,
  RECIPE_INGESTION_DEFAULT_RECIPE_CATEGORY_ID,
} from '@mealio/shared';
import { Prisma } from '@mealio/shared/prisma-client';
import type { ProposedCategoryPayload } from '../validators/retrieved-data.validator';

/**
 * LLM 제안 카테고리·기존 categoryId 해석 (Prisma 트랜잭션 컨텍스트)
 */
@Injectable()
export class CategoryResolverService {
  async resolveRecipeCategoryId(
    tx: Prisma.TransactionClient,
    categoryId: number | null | undefined,
    proposed: ProposedCategoryPayload | null | undefined,
  ): Promise<number> {
    if (categoryId != null) {
      const existing = await tx.recipeCategory.findFirst({
        where: { id: categoryId, isActive: true },
      });
      if (existing) {
        return existing.id;
      }
    }

    if (proposed) {
      return this.upsertRecipeCategory(tx, proposed);
    }

    return RECIPE_INGESTION_DEFAULT_RECIPE_CATEGORY_ID;
  }

  async resolveIngredientCategoryId(
    tx: Prisma.TransactionClient,
    categoryId: number | null | undefined,
    proposed: ProposedCategoryPayload | null | undefined,
  ): Promise<number> {
    if (categoryId != null) {
      const existing = await tx.ingredientCategory.findFirst({
        where: { id: categoryId, isActive: true },
      });
      if (existing) {
        return existing.id;
      }
    }

    if (proposed) {
      return this.upsertIngredientCategory(tx, proposed);
    }

    return RECIPE_INGESTION_DEFAULT_INGREDIENT_CATEGORY_ID;
  }

  private async upsertRecipeCategory(
    tx: Prisma.TransactionClient,
    proposed: ProposedCategoryPayload,
  ): Promise<number> {
    const byKey = await tx.recipeCategory.findUnique({
      where: { key: proposed.key },
    });
    if (byKey) {
      return byKey.id;
    }

    const max = await tx.recipeCategory.aggregate({ _max: { id: true } });
    const nextId = (max._max.id ?? 0) + 1;

    const created = await tx.recipeCategory.create({
      data: {
        id: nextId,
        key: proposed.key,
        name: proposed.name,
        displayOrder: nextId,
        isActive: true,
      },
    });
    return created.id;
  }

  private async upsertIngredientCategory(
    tx: Prisma.TransactionClient,
    proposed: ProposedCategoryPayload,
  ): Promise<number> {
    const byKey = await tx.ingredientCategory.findUnique({
      where: { key: proposed.key },
    });
    if (byKey) {
      return byKey.id;
    }

    const max = await tx.ingredientCategory.aggregate({ _max: { id: true } });
    const nextId = (max._max.id ?? 0) + 1;

    const created = await tx.ingredientCategory.create({
      data: {
        id: nextId,
        key: proposed.key,
        name: proposed.name,
        displayOrder: nextId,
        isActive: true,
      },
    });
    return created.id;
  }
}
