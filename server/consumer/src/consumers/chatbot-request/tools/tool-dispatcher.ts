import { Injectable } from '@nestjs/common';
import { SearchRecipesHandler } from '../handlers/SearchRecipesHandler';
import type { SearchRecipesPayload } from '../handlers/SearchRecipesHandler';
import { FoodCategoriesHandler } from '../handlers/FoodCategoriesHandler';
import { InventoryHandler } from '../handlers/InventoryHandler';
import { FinalizeRecipeSelectionHandler } from '../handlers/FinalizeRecipeSelectionHandler';
import type { SearchedRecipe } from '../handlers/SearchRecipesHandler';
import type { NumericRangeInput } from '../services/recipe-search-query.service';

export interface ToolContext {
  userId: number;
  candidateRecipes?: SearchedRecipe[];
  selectedRecipes?: SearchedRecipe[];
}

function parsePositiveNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return Math.floor(value);
}

function parseNumericRange(value: unknown): NumericRangeInput | undefined {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const gte = parsePositiveNumber(record.gte);
  const lte = parsePositiveNumber(record.lte);
  if (gte == null && lte == null) {
    return undefined;
  }

  return {
    ...(gte != null && { gte }),
    ...(lte != null && { lte }),
  };
}

function parseStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) ? (value as string[]) : undefined;
}

function parseNumberArray(value: unknown): number[] | undefined {
  return Array.isArray(value) ? (value as number[]) : undefined;
}

function parseSearchRecipesToolArgs(
  args: Record<string, unknown>,
): SearchRecipesPayload {
  return {
    keywords: parseStringArray(args.keywords),
    ingredientIds: parseNumberArray(args.ingredientIds),
    mustHaveIngredients: parseStringArray(args.mustHaveIngredients),
    avoidIngredientIds: parseNumberArray(args.avoidIngredientIds),
    avoidIngredients: parseStringArray(args.avoidIngredients),
    cookTime: parseNumericRange(args.cookTime),
    servings: parseNumericRange(args.servings),
    recipeCategoryIds: parseNumberArray(args.recipeCategoryIds),
    ingredientCategoryIds: parseNumberArray(args.ingredientCategoryIds),
  };
}

/**
 * function name → Handler 매핑·실행, tool result를 GPT에 반환
 */
@Injectable()
export class ToolDispatcher {
  constructor(
    private readonly searchRecipesHandler: SearchRecipesHandler,
    private readonly foodCategoriesHandler: FoodCategoriesHandler,
    private readonly inventoryHandler: InventoryHandler,
    private readonly finalizeRecipeSelectionHandler: FinalizeRecipeSelectionHandler,
  ) {}

  async execute(
    functionName: string,
    args: Record<string, unknown>,
    context: ToolContext,
  ): Promise<string> {
    switch (functionName) {
      case 'get_user_inventory': {
        const result = await this.inventoryHandler.execute(context.userId);
        return JSON.stringify(result);
      }
      case 'get_food_categories': {
        const result = await this.foodCategoriesHandler.execute();
        return JSON.stringify(result);
      }
      case 'search_recipes': {
        const payload = parseSearchRecipesToolArgs(args);
        const result = await this.searchRecipesHandler.execute(payload, {
          userId: context.userId,
        });
        context.candidateRecipes = result;
        context.selectedRecipes = [];
        return JSON.stringify(result);
      }
      case 'finalize_recipe_selection': {
        const selected = this.finalizeRecipeSelectionHandler.execute(
          {
            selectedRecipeIds: Array.isArray(args.selectedRecipeIds)
              ? (args.selectedRecipeIds as number[])
              : undefined,
          },
          context.candidateRecipes ?? [],
        );
        context.selectedRecipes = selected;
        return JSON.stringify(selected);
      }
      default:
        return JSON.stringify({
          error: `Unknown function: ${functionName}`,
        });
    }
  }
}
