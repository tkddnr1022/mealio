import { Injectable } from '@nestjs/common';
import { PrismaService } from '@mealio/shared';
import { RecipeEmbeddingService } from '../services/recipe-embedding.service';
import { RecipeSearchQueryService } from '../services/recipe-search-query.service';
import { RecipeEmbeddingRepository } from 'src/persistence/repositories/postgresql/recipe-embedding.repository';
import { formatNutritionSummary } from '@mealio/shared';
import type { NumericRangeInput } from '../services/recipe-search-query.service';

/** `search_recipes` 도구가 반환하는 레시피 요약(검색 결과). */
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
  cookingMethod?: string | null;
  dishType?: string | null;
  nutritionSummary?: string | null;
  topInstructionSnippet?: string | null;
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
  mustHaveIngredients?: string[];
  avoidIngredientIds?: number[];
  avoidIngredients?: string[];
  cookTime?: NumericRangeInput;
  servings?: NumericRangeInput;
  recipeCategoryIds?: number[];
  ingredientCategoryIds?: number[];
}

/** search_recipes 후보 풀 크기. 최종 추천 개수는 LLM이 이 목록에서 선택한다. */
export const SEARCH_RECIPES_RESULT_LIMIT = 10;
const RERANK_WEIGHT = {
  semantic: 0.55,
  keyword: 0.2,
  inventoryMatch: 0.15,
  userPreference: 0.1,
} as const;

export interface SearchRecipesOptions {
  userId: number;
}

/**
 * search_recipes 함수 실행 — Prisma로 레시피를 조건 필터·키워드 필터 후,
 * DB 정렬(최신 생성 순)을 유지한 채 상한만 적용해 SearchedRecipe[] 반환.
 */
@Injectable()
export class SearchRecipesHandler {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recipeEmbeddingService: RecipeEmbeddingService,
    private readonly recipeEmbeddingRepository: RecipeEmbeddingRepository,
    private readonly recipeSearchQueryService: RecipeSearchQueryService,
  ) {}

  async execute(
    payload: SearchRecipesPayload,
    options: SearchRecipesOptions,
  ): Promise<SearchedRecipe[]> {
    const keywords = this.buildKeywords(payload);
    const recipeCategoryIds = payload.recipeCategoryIds ?? [];
    const ingredientCategoryIds = payload.ingredientCategoryIds ?? [];
    const ingredientIds = payload.ingredientIds ?? [];
    const recipes = await this.recipeSearchQueryService.searchRecipes({
      cookTime: payload.cookTime,
      servings: payload.servings,
      recipeCategoryIds,
      ingredientCategoryIds,
      includeIngredientIds: ingredientIds,
      includeIngredientNames: payload.mustHaveIngredients ?? [],
      excludeIngredientIds: payload.avoidIngredientIds ?? [],
      excludeIngredientNames: payload.avoidIngredients ?? [],
    });

    const recipeIds = recipes.map((recipe) => recipe.id);
    await this.recipeEmbeddingService.ensureEmbeddingsForRecipeIds(recipeIds);

    const queryText = this.buildSemanticQueryText(payload, keywords);
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
      preferenceRows.map((row) => [row.recipeId, Number(row.score.toString())]),
    );
    const maxPreference = Math.max(
      1,
      ...preferenceRows.map((row) => Number(row.score.toString())),
    );

    const reranked = recipes
      .map((recipe) => {
        const keywordSearchText = this.buildKeywordSearchText(recipe);
        const keywordScore = this.computeKeywordScore(keywordSearchText, keywords);
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
          nutritionSummary: formatNutritionSummary(recipe.nutrition),
          topInstructionSnippet: this.extractTopInstructionSnippet(
            recipe.instructions,
          ),
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
      cookingMethod: r.cookingMethod,
      dishType: r.dishType,
      nutritionSummary: r.nutritionSummary,
      topInstructionSnippet: r.topInstructionSnippet,
      semanticScore: r.semanticScore,
      keywordScore: r.keywordScore,
      inventoryMatchScore: r.inventoryMatchScore,
      userPreferenceScore: r.userPreferenceScore,
      finalScore: r.finalScore,
      missingIngredients: r.missingIngredients,
      reasonSignals: r.reasonSignals,
    }));
  }

  private buildKeywords(payload: SearchRecipesPayload): string[] {
    return this.normalizeLowerCaseValues([
      ...(payload.keywords ?? []),
      ...(payload.mustHaveIngredients ?? []),
    ]);
  }

  private normalizeLowerCaseValues(values: string[]): string[] {
    return [
      ...new Set(values.map((value) => value.trim().toLowerCase())),
    ].filter((value) => value.length > 0);
  }

  private buildSemanticQueryText(
    payload: SearchRecipesPayload,
    keywords: string[],
  ): string {
    const sections = [
      `keywords: ${keywords.join(', ')}`,
      `must_have: ${(payload.mustHaveIngredients ?? []).join(', ')}`,
      `avoid: ${(payload.avoidIngredients ?? []).join(', ')}`,
      `cook_time: ${this.formatRangeContext(
        payload.cookTime?.gte,
        payload.cookTime?.lte,
      )}`,
      `servings: ${this.formatRangeContext(
        payload.servings?.gte,
        payload.servings?.lte,
      )}`,
    ];
    return sections.join('\n').trim();
  }

  private formatRangeContext(
    gte: number | undefined,
    lte: number | undefined,
  ): string {
    const parts: string[] = [];
    if (gte != null) {
      parts.push(`min ${gte}`);
    }
    if (lte != null) {
      parts.push(`max ${lte}`);
    }
    return parts.join(', ');
  }

  private computeKeywordScore(
    searchableText: string,
    keywords: string[],
  ): number {
    if (keywords.length === 0) {
      return 0;
    }
    const hitCount = keywords.reduce(
      (count, keyword) =>
        searchableText.includes(keyword) ? count + 1 : count,
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

  private extractTopInstructionSnippet(
    instructions: unknown,
    maxLength = 120,
  ): string | null {
    if (!Array.isArray(instructions) || instructions.length === 0) {
      return null;
    }

    for (const [index, item] of instructions.entries()) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const step = item as { step?: number; content?: string };
      const content =
        typeof step.content === 'string' ? step.content.trim() : '';
      if (!content) {
        continue;
      }
      const stepNum =
        typeof step.step === 'number' && step.step > 0 ? step.step : index + 1;
      const prefixed = `${stepNum}. ${content}`;
      if (prefixed.length <= maxLength) {
        return prefixed;
      }
      return `${prefixed.slice(0, maxLength - 1)}…`;
    }

    return null;
  }

  private buildKeywordSearchText(recipe: {
    title: string;
    description: string | null;
    cookingMethod: string | null;
    dishType: string | null;
    cookingTip: string | null;
  }): string {
    return [
      recipe.title,
      recipe.description ?? '',
      recipe.cookingMethod ?? '',
      recipe.dishType ?? '',
      recipe.cookingTip ?? '',
    ]
      .join(' ')
      .toLowerCase();
  }
}
