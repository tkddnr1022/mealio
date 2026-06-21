import { Injectable, Logger } from '@nestjs/common';
import { formatRecipeNutritionSummary, PrismaService } from '@mealio/shared';
import { OpenAIService } from 'src/integrations/openai/openai.service';
import { RecipeEmbeddingRepository } from 'src/persistence/repositories/postgresql/recipe-embedding.repository';

type RecipeInstructionStep = {
  step?: number;
  content?: string;
};

/**
 * persist 완료 레시피 → OpenAI 임베딩 → RecipeEmbedding(pgvector) 업서트
 */
@Injectable()
export class RecipeEmbeddingSyncService {
  private readonly logger = new Logger(RecipeEmbeddingSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenAIService,
    private readonly recipeEmbeddingRepository: RecipeEmbeddingRepository,
  ) {}

  async syncByRecipeId(recipeId: number): Promise<void> {
    if (!Number.isInteger(recipeId) || recipeId <= 0) {
      return;
    }

    const recipe = await this.prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        categoryMeta: { select: { key: true, name: true } },
        recipeIngredients: {
          include: {
            ingredient: {
              include: {
                categoryMeta: { select: { key: true, name: true } },
              },
            },
          },
        },
      },
    });
    if (!recipe) {
      return;
    }

    const documentText = this.buildRecipeDocument(recipe);
    const embedding = await this.openaiService.createEmbedding(documentText);
    if (embedding.length === 0) {
      throw new Error(`Recipe embedding empty. recipeId=${recipeId}`);
    }

    await this.recipeEmbeddingRepository.upsert({
      recipeId: recipe.id,
      embedding,
      documentText,
      embeddingModel: this.openaiService.getEmbeddingModel(),
      sourceUpdatedAt: recipe.updatedAt,
    });

    this.logger.debug(`recipeId=${recipe.id} embedding synced`);
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

    if (recipe.cookingMethod) {
      lines.push(`cooking_method: ${recipe.cookingMethod}`);
    }
    if (recipe.dishType) {
      lines.push(`dish_type: ${recipe.dishType}`);
    }

    const nutritionText = formatRecipeNutritionSummary(recipe.nutrition, {
      locale: 'en',
    });
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
}
