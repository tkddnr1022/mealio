import { Injectable } from '@nestjs/common';
import { SearchRecipesHandler } from '../handlers/SearchRecipesHandler';
import { FoodCategoriesHandler } from '../handlers/FoodCategoriesHandler';
import { InventoryHandler } from '../handlers/InventoryHandler';
import { FinalizeRecipeSelectionHandler } from '../handlers/FinalizeRecipeSelectionHandler';
import type { SearchedRecipe } from '../handlers/SearchRecipesHandler';

export interface ToolContext {
  userId: number;
  candidateRecipes?: SearchedRecipe[];
  selectedRecipes?: SearchedRecipe[];
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
        const payload = {
          keywords: Array.isArray(args.keywords)
            ? (args.keywords as string[])
            : undefined,
          ingredientIds: Array.isArray(args.ingredientIds)
            ? (args.ingredientIds as number[])
            : undefined,
          mustHaveIngredients: Array.isArray(args.mustHaveIngredients)
            ? (args.mustHaveIngredients as string[])
            : undefined,
          avoidIngredientIds: Array.isArray(args.avoidIngredientIds)
            ? (args.avoidIngredientIds as number[])
            : undefined,
          avoidIngredients: Array.isArray(args.avoidIngredients)
            ? (args.avoidIngredients as string[])
            : undefined,
          maxCookTime:
            typeof args.maxCookTime === 'number' ? args.maxCookTime : undefined,
          servings: typeof args.servings === 'number' ? args.servings : undefined,
          dietaryTags: Array.isArray(args.dietaryTags)
            ? (args.dietaryTags as string[])
            : undefined,
          recipeCategoryIds: Array.isArray(args.recipeCategoryIds)
            ? (args.recipeCategoryIds as number[])
            : undefined,
          ingredientCategoryIds: Array.isArray(args.ingredientCategoryIds)
            ? (args.ingredientCategoryIds as number[])
            : undefined,
        };
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
