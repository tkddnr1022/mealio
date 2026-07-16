import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@mealio/shared';
import { OpenAIService } from 'src/integrations/openai/openai.service';
import { RecipeSearchQueryService } from '../services/recipe-search-query.service';
import { RecipeSearchQueryExpansionService } from '../services/recipe-search-query-expansion.service';
import { IngredientSemanticResolverService } from '../services/ingredient-semantic-resolver.service';
import type { ResolvedIngredient } from '../services/ingredient-semantic-resolver.service';
import { RecipeEmbeddingRepository } from 'src/persistence/repositories/postgresql/recipe-embedding.repository';
import type { RecipeSemanticScore } from 'src/persistence/repositories/postgresql/recipe-embedding.repository';
import { formatNutritionSummary } from '@mealio/shared';
import type {
  NumericRangeInput,
  RecipeSearchCandidate,
} from '../services/recipe-search-query.service';
import {
  RECIPE_SEARCH_ANN_TOP_K_PER_QUERY,
  RECIPE_SEARCH_QUERY_EXPANSION_COVERAGE_BONUS,
  RECIPE_SEARCH_QUERY_EXPANSION_MAX,
  RECIPE_SEARCH_REASON_SIGNAL_THRESHOLDS,
  RECIPE_SEARCH_RERANK_WEIGHT,
  RECIPE_SEARCH_RESULT_LIMIT,
} from '../../../policy/recipe-search.policy';

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
  softConstraintScore?: number;
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

export interface SearchRecipesOptions {
  userId: number;
}

interface ResolvedSearchIngredients {
  mustHave: ResolvedIngredient[];
  avoid: ResolvedIngredient[];
  mergedAvoidIngredientIds: number[];
  mustHaveIngredientIds: number[];
  mustHaveCanonicalNames: string[];
}

/**
 * search_recipes 함수 실행 — semantic-first 후보 수집 후 hard/soft 제약 기반 재랭킹.
 */
@Injectable()
export class SearchRecipesHandler {
  private readonly logger = new Logger(SearchRecipesHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenAIService,
    private readonly recipeEmbeddingRepository: RecipeEmbeddingRepository,
    private readonly recipeSearchQueryService: RecipeSearchQueryService,
    private readonly recipeSearchQueryExpansionService: RecipeSearchQueryExpansionService,
    private readonly ingredientSemanticResolverService: IngredientSemanticResolverService,
  ) {}

  async execute(
    payload: SearchRecipesPayload,
    options: SearchRecipesOptions,
  ): Promise<SearchedRecipe[]> {
    const resolvedIngredients = await this.resolveSearchIngredients(payload);
    const keywords = this.buildKeywords(payload, resolvedIngredients);
    const baseQueryText = this.buildSemanticQueryText(
      payload,
      keywords,
      resolvedIngredients,
    );
    if (baseQueryText.length === 0) {
      return [];
    }

    const queryTexts =
      await this.recipeSearchQueryExpansionService.expandQueries({
        baseQueryText,
        mustHaveIngredients:
          resolvedIngredients.mustHaveCanonicalNames.length > 0
            ? resolvedIngredients.mustHaveCanonicalNames
            : payload.mustHaveIngredients,
        avoidIngredients: payload.avoidIngredients,
      });
    const queryEmbeddings =
      await this.openaiService.createEmbeddings(queryTexts);
    if (queryEmbeddings.length === 0) {
      return [];
    }

    const semanticRowsPerQuery = await Promise.all(
      queryEmbeddings.map((queryEmbedding) =>
        this.recipeEmbeddingRepository.searchTopK({
          queryEmbedding,
          limit: RECIPE_SEARCH_ANN_TOP_K_PER_QUERY,
          excludeIngredientIds: resolvedIngredients.mergedAvoidIngredientIds,
        }),
      ),
    );
    const semanticScoreByRecipeId =
      this.mergeSemanticScores(semanticRowsPerQuery);
    const candidateRecipeIds = [...semanticScoreByRecipeId.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(
        0,
        RECIPE_SEARCH_ANN_TOP_K_PER_QUERY * RECIPE_SEARCH_QUERY_EXPANSION_MAX,
      )
      .map(([recipeId]) => recipeId);

    if (candidateRecipeIds.length === 0) {
      return [];
    }

    const recipes = await this.recipeSearchQueryService.fetchRecipesByIds(
      candidateRecipeIds,
      {
        excludeIngredientIds: resolvedIngredients.mergedAvoidIngredientIds,
        excludeIngredientNames: payload.avoidIngredients,
      },
    );

    this.logger.debug(
      `semantic search queries=${queryTexts.length} candidates=${candidateRecipeIds.length} fetched=${recipes.length} resolvedMustHave=${resolvedIngredients.mustHave.length} resolvedAvoid=${resolvedIngredients.avoid.length}`,
    );

    return this.rerankRecipes(
      recipes,
      payload,
      options,
      semanticScoreByRecipeId,
      resolvedIngredients,
    );
  }

  private async resolveSearchIngredients(
    payload: SearchRecipesPayload,
  ): Promise<ResolvedSearchIngredients> {
    const [mustHave, avoid] = await Promise.all([
      this.ingredientSemanticResolverService.resolveNames(
        payload.mustHaveIngredients ?? [],
      ),
      this.ingredientSemanticResolverService.resolveNames(
        payload.avoidIngredients ?? [],
      ),
    ]);

    const mergedAvoidIngredientIds = this.mergeUniquePositiveIds([
      ...(payload.avoidIngredientIds ?? []),
      ...avoid.map((item) => item.ingredientId),
    ]);
    const mustHaveIngredientIds = mustHave.map((item) => item.ingredientId);
    const mustHaveCanonicalNames = mustHave.map((item) => item.canonicalName);

    return {
      mustHave,
      avoid,
      mergedAvoidIngredientIds,
      mustHaveIngredientIds,
      mustHaveCanonicalNames,
    };
  }

  private mergeSemanticScores(
    semanticRowsPerQuery: RecipeSemanticScore[][],
  ): Map<number, number> {
    const merged = new Map<number, { maxScore: number; hitCount: number }>();

    for (const rows of semanticRowsPerQuery) {
      for (const row of rows) {
        const current = merged.get(row.recipeId);
        if (!current) {
          merged.set(row.recipeId, {
            maxScore: row.semanticScore,
            hitCount: 1,
          });
          continue;
        }

        current.maxScore = Math.max(current.maxScore, row.semanticScore);
        current.hitCount += 1;
      }
    }

    const semanticScoreByRecipeId = new Map<number, number>();
    for (const [recipeId, value] of merged.entries()) {
      const coverageBonus =
        (value.hitCount - 1) * RECIPE_SEARCH_QUERY_EXPANSION_COVERAGE_BONUS;
      semanticScoreByRecipeId.set(
        recipeId,
        Math.max(0, Math.min(1, value.maxScore + coverageBonus)),
      );
    }

    return semanticScoreByRecipeId;
  }

  private async rerankRecipes(
    recipes: RecipeSearchCandidate[],
    payload: SearchRecipesPayload,
    options: SearchRecipesOptions,
    semanticScoreByRecipeId: Map<number, number>,
    resolvedIngredients: ResolvedSearchIngredients,
  ): Promise<SearchedRecipe[]> {
    const keywords = this.buildKeywords(payload, resolvedIngredients);
    const recipeIds = recipes.map((recipe) => recipe.id);

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
        const keywordScore = this.computeKeywordScore(
          keywordSearchText,
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
        const softConstraintScore = this.computeSoftConstraintScore(
          recipe,
          payload,
          resolvedIngredients,
        );
        const finalScore =
          semanticScore * RECIPE_SEARCH_RERANK_WEIGHT.semantic +
          keywordScore * RECIPE_SEARCH_RERANK_WEIGHT.keyword +
          inventoryMatchScore * RECIPE_SEARCH_RERANK_WEIGHT.inventoryMatch +
          userPreferenceScore * RECIPE_SEARCH_RERANK_WEIGHT.userPreference +
          softConstraintScore * RECIPE_SEARCH_RERANK_WEIGHT.softConstraint;

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
          softConstraintScore,
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
            softConstraintScore,
            payload,
            recipe,
          }),
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore)
      .slice(0, RECIPE_SEARCH_RESULT_LIMIT);

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
      semanticScore: this.roundScore(r.semanticScore),
      keywordScore: this.roundScore(r.keywordScore),
      inventoryMatchScore: this.roundScore(r.inventoryMatchScore),
      userPreferenceScore: this.roundScore(r.userPreferenceScore),
      softConstraintScore: this.roundScore(r.softConstraintScore),
      finalScore: this.roundScore(r.finalScore),
      missingIngredients: r.missingIngredients,
      reasonSignals: r.reasonSignals,
    }));
  }

  /** 결과 출력용 score를 소수점 4자리로 제한한다. */
  private roundScore(score: number): number {
    return Number(score.toFixed(4));
  }

  private buildKeywords(
    payload: SearchRecipesPayload,
    resolvedIngredients: ResolvedSearchIngredients,
  ): string[] {
    const mustHaveNames =
      resolvedIngredients.mustHaveCanonicalNames.length > 0
        ? resolvedIngredients.mustHaveCanonicalNames
        : (payload.mustHaveIngredients ?? []);

    return this.normalizeLowerCaseValues([
      ...(payload.keywords ?? []),
      ...mustHaveNames,
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
    resolvedIngredients: ResolvedSearchIngredients,
  ): string {
    const mustHaveNames =
      resolvedIngredients.mustHaveCanonicalNames.length > 0
        ? resolvedIngredients.mustHaveCanonicalNames
        : (payload.mustHaveIngredients ?? []);

    const sections = [
      `keywords: ${keywords.join(', ')}`,
      `must_have: ${mustHaveNames.join(', ')}`,
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

  private computeSoftConstraintScore(
    recipe: RecipeSearchCandidate,
    payload: SearchRecipesPayload,
    resolvedIngredients: ResolvedSearchIngredients,
  ): number {
    const scores: number[] = [];

    const cookTimeScore = this.computeNumericRangeScore(
      recipe.cookTime,
      payload.cookTime,
    );
    if (cookTimeScore != null) {
      scores.push(cookTimeScore);
    }

    const servingsScore = this.computeNumericRangeScore(
      recipe.servings,
      payload.servings,
    );
    if (servingsScore != null) {
      scores.push(servingsScore);
    }

    const recipeCategoryIds = this.normalizePositiveIds(
      payload.recipeCategoryIds ?? [],
    );
    if (recipeCategoryIds.length > 0) {
      scores.push(recipeCategoryIds.includes(recipe.categoryId) ? 1 : 0);
    }

    const ingredientCategoryIds = this.normalizePositiveIds(
      payload.ingredientCategoryIds ?? [],
    );
    if (ingredientCategoryIds.length > 0) {
      const recipeIngredientCategoryIds = recipe.recipeIngredients.map(
        (row) => row.ingredient.categoryId,
      );
      const matched = recipeIngredientCategoryIds.some((categoryId) =>
        ingredientCategoryIds.includes(categoryId),
      );
      scores.push(matched ? 1 : 0);
    }

    const mustHaveIngredientIds = this.normalizePositiveIds(
      resolvedIngredients.mustHaveIngredientIds,
    );
    if (mustHaveIngredientIds.length > 0) {
      const recipeIngredientIds = recipe.recipeIngredients.map(
        (row) => row.ingredientId,
      );
      const hitCount = mustHaveIngredientIds.filter((ingredientId) =>
        recipeIngredientIds.includes(ingredientId),
      ).length;
      scores.push(hitCount / mustHaveIngredientIds.length);
    } else {
      const mustHaveIngredients = this.normalizeLowerCaseValues(
        payload.mustHaveIngredients ?? [],
      );
      if (mustHaveIngredients.length > 0) {
        const ingredientNames = recipe.recipeIngredients.map((row) =>
          row.ingredient.name.toLowerCase(),
        );
        const hitCount = mustHaveIngredients.reduce(
          (count, ingredient) =>
            ingredientNames.some((name) => name.includes(ingredient))
              ? count + 1
              : count,
          0,
        );
        scores.push(hitCount / mustHaveIngredients.length);
      }
    }

    if (scores.length === 0) {
      return 0;
    }

    const total = scores.reduce((sum, score) => sum + score, 0);
    return Math.max(0, Math.min(1, total / scores.length));
  }

  private computeNumericRangeScore(
    value: number | null,
    range?: NumericRangeInput,
  ): number | null {
    if (!range || value == null) {
      return null;
    }

    const normalizedRange = {
      gte:
        typeof range.gte === 'number' &&
        Number.isFinite(range.gte) &&
        range.gte > 0
          ? Math.floor(range.gte)
          : undefined,
      lte:
        typeof range.lte === 'number' &&
        Number.isFinite(range.lte) &&
        range.lte > 0
          ? Math.floor(range.lte)
          : undefined,
    };

    if (normalizedRange.gte == null && normalizedRange.lte == null) {
      return null;
    }

    const inRange =
      (normalizedRange.gte == null || value >= normalizedRange.gte) &&
      (normalizedRange.lte == null || value <= normalizedRange.lte);
    return inRange ? 1 : 0;
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

  private buildReasonSignals(input: {
    semanticScore: number;
    keywordScore: number;
    inventoryMatchScore: number;
    userPreferenceScore: number;
    softConstraintScore: number;
    payload: SearchRecipesPayload;
    recipe: RecipeSearchCandidate;
  }): string[] {
    const reasons: string[] = [];
    if (
      input.semanticScore >= RECIPE_SEARCH_REASON_SIGNAL_THRESHOLDS.semantic
    ) {
      reasons.push('semantic_match');
    }
    if (input.keywordScore >= RECIPE_SEARCH_REASON_SIGNAL_THRESHOLDS.keyword) {
      reasons.push('keyword_match');
    }
    if (
      input.inventoryMatchScore >=
      RECIPE_SEARCH_REASON_SIGNAL_THRESHOLDS.inventoryMatch
    ) {
      reasons.push('inventory_match');
    }
    if (
      input.userPreferenceScore >=
      RECIPE_SEARCH_REASON_SIGNAL_THRESHOLDS.userPreference
    ) {
      reasons.push('user_preference');
    }
    if (
      input.softConstraintScore >=
      RECIPE_SEARCH_REASON_SIGNAL_THRESHOLDS.softConstraint
    ) {
      reasons.push('soft_constraint_match');
    }

    if (
      this.computeNumericRangeScore(
        input.recipe.cookTime,
        input.payload.cookTime,
      ) === 1
    ) {
      reasons.push('cook_time_match');
    }
    if (
      this.computeNumericRangeScore(
        input.recipe.servings,
        input.payload.servings,
      ) === 1
    ) {
      reasons.push('servings_match');
    }

    const recipeCategoryIds = this.normalizePositiveIds(
      input.payload.recipeCategoryIds ?? [],
    );
    if (
      recipeCategoryIds.length > 0 &&
      recipeCategoryIds.includes(input.recipe.categoryId)
    ) {
      reasons.push('category_match');
    }

    return reasons;
  }

  private normalizePositiveIds(values: number[]): number[] {
    return this.mergeUniquePositiveIds(values);
  }

  private mergeUniquePositiveIds(values: number[]): number[] {
    return [
      ...new Set(
        values.filter((value) => Number.isInteger(value) && value > 0),
      ),
    ];
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
