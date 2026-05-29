import { buildQueryString, objectToQuery } from '@/lib/api/query';
import type { RecipeSearchQuery } from '@/lib/types/recipe';

export const DEFAULT_RECIPE_COOK_TIME_MIN = 0;
export const DEFAULT_RECIPE_COOK_TIME_MAX = 120;

export const RECIPE_SEARCH_PATH = '/recipe/search' as const;
export const RECIPE_FILTER_PATH = '/recipe/filter' as const;

export interface RecipeFilterDraftState {
  keyword: string;
  selectedDifficulties: number[];
  selectedCategoryId: number | null;
  cookTimeRange: {
    minValue: number;
    maxValue: number;
  };
}

export function toPositiveInt(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
  return parsed;
}

export function parseRecipeDifficulty(values: readonly string[]): number[] {
  const parsed = values
    .flatMap((item) => item.split(','))
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .map((item) => Number.parseInt(item, 10))
    .filter((item) => Number.isFinite(item) && item >= 1 && item <= 5);

  return Array.from(new Set(parsed)).sort((a, b) => a - b);
}

export function parseRecipeFilterDraftState(
  searchParams: URLSearchParams,
): RecipeFilterDraftState {
  const keyword = (searchParams.get('q') ?? '').trim();
  const selectedDifficulties = parseRecipeDifficulty(
    searchParams.getAll('difficulty'),
  );
  const selectedCategoryId =
    toPositiveInt(searchParams.get('categoryId')) ?? null;
  const parsedCookTimeMin = toPositiveInt(searchParams.get('cookTimeMin'));
  const parsedCookTimeMax = toPositiveInt(searchParams.get('cookTimeMax'));
  const cookTimeRange = {
    minValue:
      parsedCookTimeMin !== undefined &&
      parsedCookTimeMin >= DEFAULT_RECIPE_COOK_TIME_MIN
        ? parsedCookTimeMin
        : DEFAULT_RECIPE_COOK_TIME_MIN,
    maxValue:
      parsedCookTimeMax !== undefined &&
      parsedCookTimeMax <= DEFAULT_RECIPE_COOK_TIME_MAX
        ? parsedCookTimeMax
        : DEFAULT_RECIPE_COOK_TIME_MAX,
  };

  return {
    keyword,
    selectedDifficulties,
    selectedCategoryId,
    cookTimeRange:
      cookTimeRange.minValue <= cookTimeRange.maxValue
        ? cookTimeRange
        : {
            minValue: DEFAULT_RECIPE_COOK_TIME_MIN,
            maxValue: DEFAULT_RECIPE_COOK_TIME_MAX,
          },
  };
}

export function buildRecipeSearchQueryFromDraft(
  draft: RecipeFilterDraftState,
): RecipeSearchQuery {
  const trimmedKeyword = draft.keyword.trim();
  return {
    q: trimmedKeyword || undefined,
    difficulty:
      draft.selectedDifficulties.length > 0
        ? draft.selectedDifficulties
        : undefined,
    categoryId: draft.selectedCategoryId ?? undefined,
    cookTimeMin:
      draft.cookTimeRange.minValue > DEFAULT_RECIPE_COOK_TIME_MIN
        ? draft.cookTimeRange.minValue
        : undefined,
    cookTimeMax:
      draft.cookTimeRange.maxValue < DEFAULT_RECIPE_COOK_TIME_MAX
        ? draft.cookTimeRange.maxValue
        : undefined,
  };
}

export function buildRecipeSearchHref(
  searchQuery: RecipeSearchQuery,
): string {
  const queryString = buildQueryString(
    objectToQuery({
      q: searchQuery.q,
      difficulty: searchQuery.difficulty,
      cookTimeMin: searchQuery.cookTimeMin,
      cookTimeMax: searchQuery.cookTimeMax,
      categoryId: searchQuery.categoryId,
      cookingMethod: searchQuery.cookingMethod,
      dishType: searchQuery.dishType,
      sort: searchQuery.sort,
    }),
  );

  return queryString
    ? `${RECIPE_SEARCH_PATH}?${queryString}`
    : RECIPE_SEARCH_PATH;
}

export function buildRecipeFilterHref(
  searchQuery: RecipeSearchQuery,
): string {
  const queryString = buildQueryString(
    objectToQuery({
      q: searchQuery.q,
      difficulty: searchQuery.difficulty,
      cookTimeMin: searchQuery.cookTimeMin,
      cookTimeMax: searchQuery.cookTimeMax,
      categoryId: searchQuery.categoryId,
      cookingMethod: searchQuery.cookingMethod,
      dishType: searchQuery.dishType,
    }),
  );

  return queryString ? `${RECIPE_FILTER_PATH}?${queryString}` : RECIPE_FILTER_PATH;
}
