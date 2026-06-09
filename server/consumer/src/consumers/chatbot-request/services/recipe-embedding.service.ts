import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@mealio/shared';
import { OpenAIService } from 'src/integrations/openai/openai.service';
import { RecipeEmbeddingRepository } from 'src/persistence/repositories/postgresql/recipe-embedding.repository';

export interface RecipeEmbeddingSyncResult {
  syncedRecipeIds: number[];
  skippedRecipeIds: number[];
}

type RecipeInstructionStep = {
  step?: number;
  content?: string;
};

type RecipeNutrition = {
  calories?: number;
  carbohydrates?: number;
  protein?: number;
  fat?: number;
  sodium?: number;
};

@Injectable()
export class RecipeEmbeddingService {
  private readonly logger = new Logger(RecipeEmbeddingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenAIService,
    private readonly recipeEmbeddingRepository: RecipeEmbeddingRepository,
  ) {}

  async ensureEmbeddingsForRecipeIds(
    recipeIds: number[],
  ): Promise<RecipeEmbeddingSyncResult> {
    const uniqueRecipeIds = [...new Set(recipeIds)].filter((id) => id > 0);
    if (uniqueRecipeIds.length === 0) {
      return { syncedRecipeIds: [], skippedRecipeIds: [] };
    }

    const recipes = await this.prisma.recipe.findMany({
      where: {
        id: { in: uniqueRecipeIds },
        isPublished: true,
      },
      include: {
        categoryMeta: { select: { key: true, name: true } },
        recipeIngredients: {
          select: {
            ingredient: {
              select: {
                id: true,
                name: true,
                categoryMeta: { select: { key: true, name: true } },
              },
            },
            amount: true,
            unit: true,
            isOptional: true,
          },
        },
      },
    });

    const existing = await this.recipeEmbeddingRepository.findExisting(
      recipes.map((recipe) => recipe.id),
    );

    const syncedRecipeIds: number[] = [];
    const skippedRecipeIds: number[] = [];
    for (const recipe of recipes) {
      const current = existing.get(recipe.id);
      if (
        current &&
        current.sourceUpdatedAt.getTime() >= recipe.updatedAt.getTime()
      ) {
        skippedRecipeIds.push(recipe.id);
        continue;
      }

      const documentText = this.buildRecipeDocument(recipe);
      const embedding = await this.openaiService.createEmbedding(documentText);
      if (embedding.length === 0) {
        this.logger.warn(`Embedding empty. recipeId=${recipe.id}`);
        skippedRecipeIds.push(recipe.id);
        continue;
      }

      await this.recipeEmbeddingRepository.upsert({
        recipeId: recipe.id,
        embedding,
        documentText,
        embeddingModel: this.openaiService.getEmbeddingModel(),
        sourceUpdatedAt: recipe.updatedAt,
      });
      syncedRecipeIds.push(recipe.id);
    }

    return { syncedRecipeIds, skippedRecipeIds };
  }

  async createQueryEmbedding(queryText: string): Promise<number[]> {
    const normalized = queryText.trim();
    if (normalized.length === 0) {
      return [];
    }
    return this.openaiService.createEmbedding(normalized);
  }

  private buildRecipeDocument(recipe: {
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
  }): string {
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
        const unitText = row.unit ? row.unit : '';
        const optionalText = row.isOptional ? ' optional' : '';
        return `${row.ingredient.name}${amountText}${unitText}${optionalText} (${row.ingredient.categoryMeta.name})`;
      })
      .join(', ');

    const description = recipe.description ?? '';
    const lines = [
      `recipe_id: ${recipe.id}`,
      `title: ${recipe.title}`,
      `description: ${description}`,
      `category: ${recipe.categoryMeta.name} (${recipe.categoryMeta.key})`,
      `cook_time_minutes: ${recipe.cookTime}`,
      `difficulty: ${recipe.difficulty}`,
      `servings: ${recipe.servings}`,
    ];

    if (recipe.cookingMethod) {
      lines.push(`cooking_method: ${recipe.cookingMethod}`);
    }
    if (recipe.dishType) {
      lines.push(`dish_type: ${recipe.dishType}`);
    }

    const nutritionText = this.formatNutrition(recipe.nutrition);
    if (nutritionText) {
      lines.push(`nutrition_per_serving: ${nutritionText}`);
    }
    if (recipe.cookingTip) {
      lines.push(`cooking_tip: ${recipe.cookingTip}`);
    }

    lines.push(`ingredients: ${ingredients}`);

    const instructionsText = this.formatInstructions(recipe.instructions);
    if (instructionsText) {
      lines.push(`instructions: ${instructionsText}`);
    }

    return lines.join('\n');
  }

  private formatInstructions(instructions: unknown): string {
    if (!Array.isArray(instructions) || instructions.length === 0) {
      return '';
    }

    return instructions
      .map((item, index) => {
        if (!item || typeof item !== 'object') {
          return null;
        }
        const step = item as RecipeInstructionStep;
        const stepNum =
          typeof step.step === 'number' && step.step > 0
            ? step.step
            : index + 1;
        const content =
          typeof step.content === 'string' ? step.content.trim() : '';
        if (!content) {
          return null;
        }
        return `${stepNum}. ${content}`;
      })
      .filter((line): line is string => line != null)
      .join(' ');
  }

  private formatNutrition(nutrition: unknown): string {
    if (
      nutrition == null ||
      typeof nutrition !== 'object' ||
      Array.isArray(nutrition)
    ) {
      return '';
    }

    const values = nutrition as RecipeNutrition;
    const parts: string[] = [];
    if (typeof values.calories === 'number') {
      parts.push(`calories ${values.calories}kcal`);
    }
    if (typeof values.carbohydrates === 'number') {
      parts.push(`carbohydrates ${values.carbohydrates}g`);
    }
    if (typeof values.protein === 'number') {
      parts.push(`protein ${values.protein}g`);
    }
    if (typeof values.fat === 'number') {
      parts.push(`fat ${values.fat}g`);
    }
    if (typeof values.sodium === 'number') {
      parts.push(`sodium ${values.sodium}mg`);
    }
    return parts.join(', ');
  }
}
