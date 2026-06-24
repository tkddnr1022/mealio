import { Injectable } from '@nestjs/common';
import { formatRecipeNutritionSummary } from '@mealio/shared';
import {
  RecipeRepository,
  type RecipeForEmbeddingDocument,
} from 'src/persistence/repositories/postgresql/recipe.repository';

type RecipeInstructionStep = { step?: number; content?: string };

export interface RecipeEmbeddingDocument {
  recipeId: number;
  documentText: string;
  sourceUpdatedAt: Date;
}

@Injectable()
export class RecipeEmbeddingDocumentService {
  constructor(private readonly recipeRepository: RecipeRepository) {}

  async buildDocumentByRecipeId(
    recipeId: number,
  ): Promise<RecipeEmbeddingDocument | null> {
    const recipe =
      await this.recipeRepository.findForEmbeddingDocument(recipeId);
    if (!recipe) return null;
    return {
      recipeId: recipe.id,
      documentText: this.buildRecipeDocument(recipe),
      sourceUpdatedAt: recipe.updatedAt,
    };
  }

  private buildRecipeDocument(recipe: RecipeForEmbeddingDocument): string {
    const ingredients = recipe.recipeIngredients
      .map((row) => {
        const amountText =
          row.amount != null
            ? ` ${
                typeof row.amount === 'string' ||
                typeof row.amount === 'number' ||
                typeof row.amount === 'boolean'
                  ? String(row.amount)
                  : JSON.stringify(row.amount)
              }`
            : '';
        const unitText = row.unit ?? '';
        const optionalText = row.isOptional ? ' optional' : '';
        return `${row.ingredient.name}${amountText}${unitText}${optionalText} (${row.ingredient.categoryMeta.name})`;
      })
      .join(', ');

    const lines = [
      `recipe_id: ${recipe.id}`,
      `title: ${recipe.title}`,
      `description: ${recipe.description ?? ''}`,
      `category: ${recipe.categoryMeta.name} (${recipe.categoryMeta.key})`,
      `cook_time_minutes: ${recipe.cookTime}`,
      `difficulty: ${recipe.difficulty}`,
      `servings: ${recipe.servings}`,
    ];
    if (recipe.cookingMethod)
      lines.push(`cooking_method: ${recipe.cookingMethod}`);
    if (recipe.dishType) lines.push(`dish_type: ${recipe.dishType}`);

    const nutritionText = formatRecipeNutritionSummary(recipe.nutrition, {
      locale: 'en',
    });
    if (nutritionText) lines.push(`nutrition_per_serving: ${nutritionText}`);
    if (recipe.cookingTip) lines.push(`cooking_tip: ${recipe.cookingTip}`);
    lines.push(`ingredients: ${ingredients}`);

    const instructionsText = this.formatInstructions(recipe.instructions);
    if (instructionsText) lines.push(`instructions: ${instructionsText}`);
    return lines.join('\n');
  }

  private formatInstructions(instructions: unknown): string {
    if (!Array.isArray(instructions) || instructions.length === 0) {
      return '';
    }
    return instructions
      .map((item, index) => {
        if (!item || typeof item !== 'object') return null;
        const step = item as RecipeInstructionStep;
        const stepNum =
          typeof step.step === 'number' && step.step > 0
            ? step.step
            : index + 1;
        const content =
          typeof step.content === 'string' ? step.content.trim() : '';
        if (!content) return null;
        return `${stepNum}. ${content}`;
      })
      .filter((line): line is string => line != null)
      .join(' ');
  }
}
