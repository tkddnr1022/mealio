import { Injectable } from '@nestjs/common';
import { Prisma } from '@mealio/shared/prisma-client';
import {
  PrismaService,
  RedisService,
  cacheKeyChatbotFoodCategories,
} from '@mealio/shared';
import { RecipeEmbeddingService } from '../services/recipe-embedding.service';
import { RecipeEmbeddingRepository } from 'src/persistence/repositories/postgresql/recipe-embedding.repository';
import type { StructuredRecipeIntent } from './QueryUnderstandingHandler';

/** `search_recipes` 도구가 반환하는 레시피 요약(검색 결과). 추천·랭킹 점수는 포함하지 않는다. */
export interface SearchedRecipe {
  id: number;
  title: string;
  description: string | null;
  difficulty: number | null;
  cookTime: number | null;
  imageUrl: string | null;
  servings: number | null;
  /** RecipeCategory.id */
  categoryId: number;
  categoryName: string;
  semanticScore?: number;
  keywordScore?: number;
  inventoryMatchScore?: number;
  userPreferenceScore?: number;
  finalScore?: number;
  missingIngredients?: string[];
  reasonSignals?: string[];
}

export interface SearchRecipesPayload {
  keywords?: string[];
  ingredientIds?: number[];
  recipeCategoryIds?: number[];
  ingredientCategoryIds?: number[];
  maxCookTime?: number;
  intentKeywords?: string[];
  avoidIngredients?: string[];
}

export interface FoodCategoriesResult {
  recipeCategories: Array<{
    id: number;
    key: string;
    name: string;
    displayOrder: number;
  }>;
  ingredientCategories: Array<{
    id: number;
    key: string;
    name: string;
    displayOrder: number;
  }>;
}

/** search_recipes 후보 풀 크기. 최종 추천 개수는 LLM이 이 목록에서 선택한다. */
export const SEARCH_RECIPES_RESULT_LIMIT = 10;
/** Producer RecipeCacheStrategy·레시피 카테고리 API와 동일하게 1시간 */
const FOOD_CATEGORIES_CACHE_TTL_SECONDS = 3600;
const RERANK_WEIGHT = {
  semantic: 0.55,
  keyword: 0.2,
  inventoryMatch: 0.15,
  userPreference: 0.1,
} as const;

export interface SearchRecipesOptions {
  userId: number;
  structuredIntent?: StructuredRecipeIntent;
}

/**
 * search_recipes 함수 실행 — Prisma로 레시피를 조건 필터·키워드 필터 후,
 * DB 정렬(최신 생성 순)을 유지한 채 상한만 적용해 SearchedRecipe[] 반환.
 */
@Injectable()
export class SearchRecipesHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly recipeEmbeddingService: RecipeEmbeddingService,
    private readonly recipeEmbeddingRepository: RecipeEmbeddingRepository,
  ) {}

  /**
   * 레시피·재료 카테고리 마스터 (활성만, 정렬 순). Redis 캐시 1시간.
   */
  async getFoodCategories(): Promise<FoodCategoriesResult> {
    const key = cacheKeyChatbotFoodCategories();
    const cached = await this.redis.get(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as FoodCategoriesResult;
        if (
          Array.isArray(parsed.recipeCategories) &&
          Array.isArray(parsed.ingredientCategories)
        ) {
          return parsed;
        }
      } catch {
        /* 캐시 손상 시 DB 재조회 */
      }
    }

    const [recipeCategories, ingredientCategories] = await Promise.all([
      this.prisma.recipeCategory.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
        select: { id: true, key: true, name: true, displayOrder: true },
      }),
      this.prisma.ingredientCategory.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
        select: { id: true, key: true, name: true, displayOrder: true },
      }),
    ]);
    const result: FoodCategoriesResult = {
      recipeCategories,
      ingredientCategories,
    };
    await this.redis.set(
      key,
      JSON.stringify(result),
      FOOD_CATEGORIES_CACHE_TTL_SECONDS,
    );
    return result;
  }

  async execute(
    payload: SearchRecipesPayload,
    options: SearchRecipesOptions,
  ): Promise<SearchedRecipe[]> {
    const keywords = this.buildKeywords(payload, options.structuredIntent);
    const maxCookTime =
      payload.maxCookTime ?? options.structuredIntent?.maxCookTime ?? undefined;
    const recipeCategoryIds = payload.recipeCategoryIds ?? [];
    const ingredientCategoryIds = payload.ingredientCategoryIds ?? [];
    const avoidIngredients = this.normalizeLowerCaseValues([
      ...(payload.avoidIngredients ?? []),
      ...(options.structuredIntent?.avoidIngredients ?? []),
    ]);

    const where: Prisma.RecipeWhereInput = {
      isPublished: true,
      ...(maxCookTime != null && {
        cookTime: { lte: maxCookTime },
      }),
      ...(recipeCategoryIds.length > 0 && {
        categoryId: { in: recipeCategoryIds },
      }),
    };

    const ingredientIds = payload.ingredientIds ?? [];
    const relationAnd: Prisma.RecipeWhereInput[] = [];
    if (ingredientCategoryIds.length > 0) {
      relationAnd.push({
        recipeIngredients: {
          some: {
            ingredient: {
              categoryId: { in: ingredientCategoryIds },
            },
          },
        },
      });
    }
    if (ingredientIds.length > 0) {
      relationAnd.push({
        recipeIngredients: {
          some: { ingredientId: { in: ingredientIds } },
        },
      });
    }
    if (relationAnd.length > 0) {
      where.AND = relationAnd;
    }
    if (avoidIngredients.length > 0) {
      const avoidFilter: Prisma.RecipeWhereInput = {
        recipeIngredients: {
          none: {
            ingredient: {
              OR: avoidIngredients.map((name) => ({
                name: {
                  contains: name,
                  mode: Prisma.QueryMode.insensitive,
                },
              })),
            },
          },
        },
      };
      const currentAnd = where.AND
        ? Array.isArray(where.AND)
          ? where.AND
          : [where.AND]
        : [];
      where.AND = [...currentAnd, avoidFilter];
    }

    const recipes = await this.prisma.recipe.findMany({
      where,
      include: {
        categoryMeta: { select: { id: true, name: true } },
        recipeIngredients: {
          select: {
            ingredientId: true,
            isOptional: true,
            ingredient: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      take: 80,
      orderBy: { createdAt: 'desc' },
    });

    const recipeIds = recipes.map((recipe) => recipe.id);
    await this.recipeEmbeddingService.ensureEmbeddingsForRecipeIds(recipeIds);

    const queryText = this.buildSemanticQueryText(keywords, options.structuredIntent);
    const queryEmbedding =
      queryText.length > 0
        ? await this.recipeEmbeddingService.createQueryEmbedding(queryText)
        : [];
    const semanticRows =
      queryEmbedding.length > 0
        ? await this.recipeEmbeddingRepository.searchByRecipeIds(
            recipeIds,
            queryEmbedding,
          )
        : [];
    const semanticScoreByRecipeId = new Map(
      semanticRows.map((row) => [row.recipeId, row.semanticScore]),
    );

    const preferenceRows = await this.prisma.userRecipeRecommendation.findMany({
      where: {
        userId: options.userId,
        recipeId: { in: recipeIds },
      },
      select: {
        recipeId: true,
        score: true,
      },
    });
    const preferenceScoreByRecipeId = new Map(
      preferenceRows.map((row) => [
        row.recipeId,
        Number(row.score.toString()),
      ]),
    );
    const maxPreference = Math.max(
      1,
      ...preferenceRows.map((row) => Number(row.score.toString())),
    );

    const reranked = recipes
      .map((recipe) => {
        const keywordScore = this.computeKeywordScore(
          recipe.title,
          recipe.description,
          keywords,
        );
        const inventoryMatchScore = this.computeInventoryMatchScore(
          payload.ingredientIds ?? [],
          recipe.recipeIngredients.map((row) => row.ingredientId),
        );
        const semanticScore = semanticScoreByRecipeId.get(recipe.id) ?? 0;
        const userPreferenceRaw = preferenceScoreByRecipeId.get(recipe.id) ?? 0;
        const userPreferenceScore = Math.max(
          0,
          Math.min(1, userPreferenceRaw / maxPreference),
        );
        const finalScore =
          semanticScore * RERANK_WEIGHT.semantic +
          keywordScore * RERANK_WEIGHT.keyword +
          inventoryMatchScore * RERANK_WEIGHT.inventoryMatch +
          userPreferenceScore * RERANK_WEIGHT.userPreference;

        const missingIngredients = this.computeMissingIngredients(
          payload.ingredientIds ?? [],
          recipe.recipeIngredients,
        );

        return {
          ...recipe,
          semanticScore,
          keywordScore,
          inventoryMatchScore,
          userPreferenceScore,
          finalScore,
          missingIngredients,
          reasonSignals: this.buildReasonSignals({
            semanticScore,
            keywordScore,
            inventoryMatchScore,
            userPreferenceScore,
          }),
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, SEARCH_RECIPES_RESULT_LIMIT);

    return reranked.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      difficulty: r.difficulty,
      cookTime: r.cookTime,
      imageUrl: r.imageUrl,
      servings: r.servings,
      categoryId: r.categoryId,
      categoryName: r.categoryMeta.name,
      semanticScore: r.semanticScore,
      keywordScore: r.keywordScore,
      inventoryMatchScore: r.inventoryMatchScore,
      userPreferenceScore: r.userPreferenceScore,
      finalScore: r.finalScore,
      missingIngredients: r.missingIngredients,
      reasonSignals: r.reasonSignals,
    }));
  }

  private buildKeywords(
    payload: SearchRecipesPayload,
    intent?: StructuredRecipeIntent,
  ): string[] {
    return this.normalizeLowerCaseValues([
      ...(payload.keywords ?? []),
      ...(payload.intentKeywords ?? []),
      ...(intent?.keywords ?? []),
      ...(intent?.mustHaveIngredients ?? []),
    ]);
  }

  private normalizeLowerCaseValues(values: string[]): string[] {
    return [...new Set(values.map((value) => value.trim().toLowerCase()))].filter(
      (value) => value.length > 0,
    );
  }

  private buildSemanticQueryText(
    keywords: string[],
    intent?: StructuredRecipeIntent,
  ): string {
    const sections = [
      `keywords: ${keywords.join(', ')}`,
      `must_have: ${(intent?.mustHaveIngredients ?? []).join(', ')}`,
      `avoid: ${(intent?.avoidIngredients ?? []).join(', ')}`,
      `dietary_tags: ${(intent?.dietaryTags ?? []).join(', ')}`,
      `intent_type: ${intent?.intentType ?? 'search'}`,
    ];
    return sections.join('\n').trim();
  }

  private computeKeywordScore(
    title: string,
    description: string | null,
    keywords: string[],
  ): number {
    if (keywords.length === 0) {
      return 0;
    }
    const source = `${title} ${description ?? ''}`.toLowerCase();
    const hitCount = keywords.reduce(
      (count, keyword) => (source.includes(keyword) ? count + 1 : count),
      0,
    );
    return Math.max(0, Math.min(1, hitCount / keywords.length));
  }

  private computeInventoryMatchScore(
    ingredientIds: number[],
    recipeIngredientIds: number[],
  ): number {
    const uniqueOwned = new Set(ingredientIds.filter((id) => id > 0));
    if (uniqueOwned.size === 0) {
      return 0;
    }
    const matched = recipeIngredientIds.filter((id) => uniqueOwned.has(id));
    return Math.max(0, Math.min(1, matched.length / uniqueOwned.size));
  }

  private computeMissingIngredients(
    ingredientIds: number[],
    recipeIngredients: Array<{
      ingredientId: number;
      isOptional: boolean;
      ingredient: { name: string };
    }>,
  ): string[] {
    const owned = new Set(ingredientIds.filter((id) => id > 0));
    return recipeIngredients
      .filter((item) => !item.isOptional && !owned.has(item.ingredientId))
      .map((item) => item.ingredient.name)
      .slice(0, 5);
  }

  private buildReasonSignals(scores: {
    semanticScore: number;
    keywordScore: number;
    inventoryMatchScore: number;
    userPreferenceScore: number;
  }): string[] {
    const reasons: string[] = [];
    if (scores.semanticScore >= 0.6) {
      reasons.push('semantic_match');
    }
    if (scores.keywordScore >= 0.5) {
      reasons.push('keyword_match');
    }
    if (scores.inventoryMatchScore >= 0.4) {
      reasons.push('inventory_match');
    }
    if (scores.userPreferenceScore >= 0.4) {
      reasons.push('user_preference');
    }
    return reasons;
  }
}
