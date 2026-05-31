import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@mealio/shared';
import { Prisma } from '@mealio/shared/prisma-client';
import {
  RECIPE_INGESTION_DEFAULT_COOK_TIME_MINUTES,
  RECIPE_INGESTION_DEFAULT_DIFFICULTY,
  RECIPE_INGESTION_RECIPE_SOURCE,
} from '@mealio/shared';
import type { RecipeIngestionJobDocument } from '@mealio/shared';
import {
  RecipeIngredientRepository,
  type RecipeIngredientRowInput,
} from '../repositories/postgresql/recipe-ingredient.repository';
import {
  IngredientMatcherService,
  type IngredientMatchMethod,
} from 'src/consumers/recipe-ingestion-persist/services/ingredient-matcher.service';
import { CategoryResolverService } from 'src/consumers/recipe-ingestion-persist/services/category-resolver.service';
import type {
  RetrievedDataPayload,
  RetrievedNutritionPayload,
  RetrievedRecipeStepPayload,
} from 'src/consumers/recipe-ingestion-persist/validators/retrieved-data.validator';
import { normalizeFoodsafetyImageUrl } from 'src/integrations/public-data/foodsafety-image-url.util';

export interface RecipeCreationResult {
  recipeId: number;
  matchMethods: IngredientMatchMethod[];
}

function parseQuantityToDecimal(
  quantity: string | null | undefined,
): string | null {
  if (quantity == null) {
    return null;
  }
  const trimmed = quantity.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 2) {
      const num = Number.parseFloat(parts[0]!.trim());
      const den = Number.parseFloat(parts[1]!.trim());
      if (!Number.isNaN(num) && !Number.isNaN(den) && den !== 0) {
        return String(num / den);
      }
    }
  }

  const parsed = Number.parseFloat(trimmed);
  return Number.isNaN(parsed) ? null : String(parsed);
}

function buildInstructions(
  steps: RetrievedRecipeStepPayload[],
): Prisma.InputJsonValue {
  return steps.map((step, index) => {
    const imageUrl = normalizeFoodsafetyImageUrl(step.imageUrl);

    const entry: { step: number; content: string; imageUrl?: string } = {
      step: index + 1,
      content: step.content,
    };
    if (imageUrl) {
      entry.imageUrl = imageUrl;
    }
    return entry;
  });
}

function toNutritionJson(
  nutrition: RetrievedNutritionPayload | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (!nutrition) {
    return Prisma.JsonNull;
  }

  const payload: RetrievedNutritionPayload = {};
  if (nutrition.calories != null) payload.calories = nutrition.calories;
  if (nutrition.carbohydrates != null) {
    payload.carbohydrates = nutrition.carbohydrates;
  }
  if (nutrition.protein != null) payload.protein = nutrition.protein;
  if (nutrition.fat != null) payload.fat = nutrition.fat;
  if (nutrition.sodium != null) payload.sodium = nutrition.sodium;

  return Object.keys(payload).length > 0
    ? (payload as Prisma.InputJsonValue)
    : Prisma.JsonNull;
}

/**
 * Recipe + RecipeIngredient + RecipeStats Prisma 트랜잭션 upsert
 */
@Injectable()
export class RecipeCreationTransaction {
  private readonly logger = new Logger(RecipeCreationTransaction.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly categoryResolver: CategoryResolverService,
    private readonly ingredientMatcher: IngredientMatcherService,
    private readonly recipeIngredientRepository: RecipeIngredientRepository,
  ) {}

  async execute(
    job: RecipeIngestionJobDocument,
    data: RetrievedDataPayload,
  ): Promise<RecipeCreationResult> {
    const sourceRecipeId = String(job.sourceId);
    const isPublished = data.parseConfidence !== 'low';

    return this.prisma.$transaction(async (tx) => {
      const categoryId = await this.categoryResolver.resolveRecipeCategoryId(
        tx,
        data.recipe.categoryId,
        data.recipe.proposedCategory,
      );

      const cookTime =
        data.recipe.cookingTimeMinutes ??
        RECIPE_INGESTION_DEFAULT_COOK_TIME_MINUTES;
      const servings = Math.max(1, data.recipe.servings ?? 2);

      const recipeData = {
        categoryId,
        title: data.recipe.title.trim().slice(0, 100),
        description: data.recipe.description?.trim() ?? null,
        instructions: buildInstructions(data.recipe.steps),
        difficulty: RECIPE_INGESTION_DEFAULT_DIFFICULTY,
        cookTime,
        servings,
        imageUrl: normalizeFoodsafetyImageUrl(data.recipe.imageUrl),
        nutrition: toNutritionJson(data.recipe.nutrition),
        cookingMethod: data.recipe.cookingMethod?.trim().slice(0, 50) ?? null,
        dishType: data.recipe.dishType?.trim().slice(0, 50) ?? null,
        cookingTip: data.recipe.tips?.trim() ?? null,
        source: RECIPE_INGESTION_RECIPE_SOURCE,
        sourceRecipeId,
        isPublished,
      };

      const existing = await tx.recipe.findUnique({
        where: {
          source_sourceRecipeId: {
            source: RECIPE_INGESTION_RECIPE_SOURCE,
            sourceRecipeId,
          },
        },
      });

      const recipe = existing
        ? await tx.recipe.update({
            where: { id: existing.id },
            data: recipeData,
          })
        : await tx.recipe.create({ data: recipeData });

      const matchMethods: IngredientMatchMethod[] = [];
      const ingredientRows: RecipeIngredientRowInput[] = [];

      for (const ingredient of data.ingredients) {
        const match = await this.ingredientMatcher.match(tx, ingredient);
        matchMethods.push(match.matchMethod);
        ingredientRows.push({
          ingredientId: match.ingredientId,
          amount: parseQuantityToDecimal(ingredient.quantity),
          unit: ingredient.unit?.trim().slice(0, 20) ?? null,
        });
      }

      await this.recipeIngredientRepository.replaceForRecipe(
        tx,
        recipe.id,
        ingredientRows,
      );

      await tx.recipeStats.upsert({
        where: { recipeId: recipe.id },
        create: {
          recipeId: recipe.id,
          viewCount: 0,
          likeCount: 0,
        },
        update: {},
      });

      this.logger.log(
        `Persisted recipe id=${recipe.id} sourceRecipeId=${sourceRecipeId} matchMethods=${matchMethods.join(',')}`,
      );

      return { recipeId: recipe.id, matchMethods };
    });
  }
}
