import { Injectable } from '@nestjs/common';
import {
  RECIPE_INGESTION_DEFAULT_INGREDIENT_CATEGORY_ID,
  RECIPE_INGESTION_DEFAULT_RECIPE_CATEGORY_ID,
} from '@mealio/shared';
import { Prisma } from '@mealio/shared/prisma-client';
import { IngredientCategoryRepository } from 'src/persistence/repositories/postgresql/ingredient-category.repository';
import { RecipeCategoryRepository } from 'src/persistence/repositories/postgresql/recipe-category.repository';
import type { ProposedCategoryPayload } from '../validators/retrieved-data.validator';

/**
 * LLM 제안 카테고리·기존 categoryId 해석
 */
@Injectable()
export class CategoryResolverService {
  constructor(
    private readonly recipeCategoryRepository: RecipeCategoryRepository,
    private readonly ingredientCategoryRepository: IngredientCategoryRepository,
  ) {}

  async resolveRecipeCategoryId(
    tx: Prisma.TransactionClient,
    categoryId: number | null | undefined,
    proposed: ProposedCategoryPayload | null | undefined,
  ): Promise<number> {
    if (categoryId != null) {
      const existing = await this.recipeCategoryRepository.findActiveById(
        tx,
        categoryId,
      );
      if (existing) {
        return existing.id;
      }
    }

    if (proposed) {
      return this.recipeCategoryRepository.upsertByKey(tx, proposed);
    }

    return RECIPE_INGESTION_DEFAULT_RECIPE_CATEGORY_ID;
  }

  async resolveIngredientCategoryId(
    tx: Prisma.TransactionClient,
    categoryId: number | null | undefined,
    proposed: ProposedCategoryPayload | null | undefined,
  ): Promise<number> {
    if (categoryId != null) {
      const existing = await this.ingredientCategoryRepository.findActiveById(
        tx,
        categoryId,
      );
      if (existing) {
        return existing.id;
      }
    }

    if (proposed) {
      return this.ingredientCategoryRepository.upsertByKey(tx, proposed);
    }

    return RECIPE_INGESTION_DEFAULT_INGREDIENT_CATEGORY_ID;
  }
}
