import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@mealio/shared';
import { OpenAIService } from 'src/integrations/openai/openai.service';
import { RecipeEmbeddingRepository } from 'src/persistence/repositories/postgresql/recipe-embedding.repository';

export interface RecipeEmbeddingSyncResult {
  syncedRecipeIds: number[];
  skippedRecipeIds: number[];
}

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
    cookTime: number;
    difficulty: number;
    servings: number;
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
        const amountText = row.amount != null ? ` ${row.amount}` : '';
        const unitText = row.unit ? row.unit : '';
        const optionalText = row.isOptional ? ' optional' : '';
        return `${row.ingredient.name}${amountText}${unitText}${optionalText} (${row.ingredient.categoryMeta.name})`;
      })
      .join(', ');

    const description = recipe.description ?? '';
    return [
      `recipe_id: ${recipe.id}`,
      `title: ${recipe.title}`,
      `description: ${description}`,
      `category: ${recipe.categoryMeta.name} (${recipe.categoryMeta.key})`,
      `cook_time_minutes: ${recipe.cookTime}`,
      `difficulty: ${recipe.difficulty}`,
      `servings: ${recipe.servings}`,
      `ingredients: ${ingredients}`,
    ].join('\n');
  }
}
