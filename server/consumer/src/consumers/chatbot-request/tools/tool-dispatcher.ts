import { Injectable } from '@nestjs/common';
import { SearchRecipesHandler } from '../handlers/SearchRecipesHandler';
import { FoodCategoriesHandler } from '../handlers/FoodCategoriesHandler';
import { InventoryHandler } from '../handlers/InventoryHandler';
import {
  QueryUnderstandingHandler,
  type StructuredRecipeIntent,
} from '../handlers/QueryUnderstandingHandler';
import { FinalizeRecipeSelectionHandler } from '../handlers/FinalizeRecipeSelectionHandler';
import type { SearchedRecipe } from '../handlers/SearchRecipesHandler';

export interface ToolContext {
  userId: number;
  userMessage: string;
  structuredIntent?: StructuredRecipeIntent;
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
    private readonly queryUnderstandingHandler: QueryUnderstandingHandler,
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
      case 'extract_recipe_intent': {
        const result = await this.queryUnderstandingHandler.execute(
          context.userMessage,
        );
        context.structuredIntent = result;
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
          avoidIngredientIds: Array.isArray(args.avoidIngredientIds)
            ? (args.avoidIngredientIds as number[])
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
          structuredIntent: context.structuredIntent,
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
