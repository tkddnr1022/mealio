import { Injectable, Logger } from '@nestjs/common';
import {
  compactRecipeNutritionForJson,
  meetsRecipeIngestionMinParseConfidence,
  RECIPE_INGESTION_MIN_PUBLISH_PARSE_CONFIDENCE,
  RECIPE_INGESTION_RECIPE_SOURCE,
  type RecipeNutritionPayload,
} from '@mealio/shared';
import { Prisma } from '@mealio/shared/prisma-client';
import type { RecipeIngestionJobDocument } from '@mealio/shared';
import {
  RecipeIngredientRepository,
  type RecipeIngredientRowInput,
} from 'src/persistence/repositories/postgresql/recipe-ingredient.repository';
import { RecipeRepository } from 'src/persistence/repositories/postgresql/recipe.repository';
import { OpenAIService } from 'src/integrations/openai/openai.service';
import {
  IngredientMatcherService,
  type IngredientMatchMethod,
} from './ingredient-matcher.domain';
import { CategoryResolverService } from './category-resolver.domain';
import type {
  RetrievedDataPayload,
  RetrievedRecipeStepPayload,
} from '../validators/retrieved-data.validator';
import {
  logIngestion,
  RECIPE_INGESTION_LOG_EVENTS,
  type RecipeIngestionLoggingOptions,
} from 'src/jobs/recipe-ingestion/recipe-ingestion-logger';
import { normalizeFoodsafetyImageUrl } from 'src/integrations/public-data/foodsafety-image-url.util';

export interface RecipeCreationResult {
  recipeId: number;
  matchMethods: IngredientMatchMethod[];
  newIngredientIds: number[];
}

type IngredientEmbeddingMap = Map<string, number[]>;

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
      const num = Number.parseFloat(parts[0].trim());
      const den = Number.parseFloat(parts[1].trim());
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
  nutrition: RecipeNutritionPayload | null | undefined,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  const payload = compactRecipeNutritionForJson(nutrition);
  return payload ? (payload as Prisma.InputJsonValue) : Prisma.JsonNull;
}

/**
 * Recipe + RecipeIngredient + RecipeStats Prisma 트랜잭션 upsert
 */
@Injectable()
export class RecipeCreationService {
  private readonly logger = new Logger(RecipeCreationService.name);

  constructor(
    private readonly recipeRepository: RecipeRepository,
    private readonly categoryResolver: CategoryResolverService,
    private readonly ingredientMatcher: IngredientMatcherService,
    private readonly recipeIngredientRepository: RecipeIngredientRepository,
    private readonly openAiService: OpenAIService,
  ) {}

  async execute(
    job: RecipeIngestionJobDocument,
    data: RetrievedDataPayload,
    options: RecipeIngestionLoggingOptions = {},
  ): Promise<RecipeCreationResult> {
    const sourceRecipeId = String(job.sourceId);
    const logBase = {
      stage: 'persist' as const,
      correlationId: options.correlationId,
      jobId: String(job._id),
      sourceRecipeId: job.sourceId,
      runId: job.runId,
    };
    const embeddingMap = await this.buildQueryEmbeddingMap(
      sourceRecipeId,
      data.ingredients,
      options.correlationId,
    );
    const isPublished = meetsRecipeIngestionMinParseConfidence(
      data.parseConfidence,
      RECIPE_INGESTION_MIN_PUBLISH_PARSE_CONFIDENCE,
    );

    return this.recipeRepository.runInTransaction(async (tx) => {
      const categoryId = await this.categoryResolver.resolveRecipeCategoryId(
        tx,
        data.recipe.categoryId,
        data.recipe.proposedCategory,
      );
      const servings = Math.max(1, data.recipe.servings ?? 2);

      const recipe = await this.recipeRepository.upsertForIngestionInTx(tx, {
        categoryId,
        title: data.recipe.title.trim().slice(0, 100),
        description: data.recipe.description?.trim() ?? null,
        instructions: buildInstructions(data.recipe.steps),
        difficulty: data.recipe.difficulty,
        cookTime: data.recipe.cookingTimeMinutes,
        servings,
        imageUrl: normalizeFoodsafetyImageUrl(data.recipe.imageUrl),
        nutrition: toNutritionJson(data.recipe.nutrition),
        cookingMethod: data.recipe.cookingMethod?.trim().slice(0, 50) ?? null,
        dishType: data.recipe.dishType?.trim().slice(0, 50) ?? null,
        cookingTip: data.recipe.tips?.trim() ?? null,
        source: RECIPE_INGESTION_RECIPE_SOURCE,
        sourceRecipeId,
        isPublished,
      });

      const matchMethods: IngredientMatchMethod[] = [];
      const newIngredientIdSet = new Set<number>();
      const ingredientRowsByIngredientId = new Map<
        number,
        RecipeIngredientRowInput
      >();
      let duplicatedIngredientCount = 0;

      for (const ingredient of data.ingredients) {
        const embeddingKey = this.resolveIngredientEmbeddingKey(ingredient);
        const match = await this.ingredientMatcher.match(
          tx,
          ingredient,
          embeddingMap?.get(embeddingKey),
          options.correlationId,
        );
        matchMethods.push(match.matchMethod);
        if (match.matchMethod === 'new') {
          newIngredientIdSet.add(match.ingredientId);
        }
        const nextRow: RecipeIngredientRowInput = {
          ingredientId: match.ingredientId,
          amount: parseQuantityToDecimal(ingredient.quantity),
          unit: ingredient.unit?.trim().slice(0, 20) ?? null,
        };
        const existing = ingredientRowsByIngredientId.get(match.ingredientId);
        if (!existing) {
          ingredientRowsByIngredientId.set(match.ingredientId, nextRow);
          continue;
        }

        duplicatedIngredientCount++;
        ingredientRowsByIngredientId.set(match.ingredientId, {
          ingredientId: match.ingredientId,
          amount: existing.amount ?? nextRow.amount,
          unit: existing.unit ?? nextRow.unit,
          isOptional:
            (existing.isOptional ?? false) || (nextRow.isOptional ?? false),
        });
      }

      const ingredientRows = Array.from(ingredientRowsByIngredientId.values());
      if (duplicatedIngredientCount > 0) {
        logIngestion(this.logger, 'warn', {
          event: RECIPE_INGESTION_LOG_EVENTS.DEGRADED,
          ...logBase,
          count: duplicatedIngredientCount,
          message: 'Deduplicated ingredient rows before persist',
        });
      }

      await this.recipeIngredientRepository.replaceForRecipe(
        tx,
        recipe.id,
        ingredientRows,
      );

      await this.recipeRepository.initializeStatsInTx(tx, recipe.id);

      logIngestion(this.logger, 'debug', {
        event: RECIPE_INGESTION_LOG_EVENTS.STAGE_COMPLETED,
        outcome: 'success',
        ...logBase,
        recipeId: recipe.id,
        matchMethods: matchMethods.join(','),
        newIngredientCount: newIngredientIdSet.size,
      });

      return {
        recipeId: recipe.id,
        matchMethods,
        newIngredientIds: [...newIngredientIdSet],
      };
    });
  }

  private async buildQueryEmbeddingMap(
    sourceRecipeId: string,
    ingredients: RetrievedDataPayload['ingredients'],
    correlationId?: string,
  ): Promise<IngredientEmbeddingMap | null> {
    const uniqueNames = [
      ...new Set(
        ingredients
          .map((ingredient) => this.resolveIngredientEmbeddingKey(ingredient))
          .filter((name) => name.length > 0),
      ),
    ];
    if (uniqueNames.length === 0) {
      return null;
    }
    try {
      const embeddings = await this.openAiService.createEmbeddings(uniqueNames);
      if (embeddings.length === 0) {
        return null;
      }
      const embeddingMap = new Map<string, number[]>();
      for (const [index, name] of uniqueNames.entries()) {
        const embedding = embeddings[index];
        if (Array.isArray(embedding) && embedding.length > 0) {
          embeddingMap.set(name, embedding);
        }
      }
      return embeddingMap;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logIngestion(this.logger, 'warn', {
        event: RECIPE_INGESTION_LOG_EVENTS.DEGRADED,
        stage: 'persist',
        correlationId,
        sourceRecipeId: Number(sourceRecipeId),
        message: `Vector lookup skipped due to embedding error: ${message}`,
      });
      return null;
    }
  }

  private resolveIngredientEmbeddingKey(ingredient: {
    ingredientAlias: string;
    normalizedName: string;
    rawName: string;
  }): string {
    const alias = ingredient.ingredientAlias.trim();
    if (alias.length > 0) {
      return alias;
    }
    const normalized = ingredient.normalizedName.trim();
    if (normalized.length > 0) {
      return normalized;
    }
    return ingredient.rawName.trim();
  }
}
