'use client';

/**
 * 레시피 React Query 훅 모음.
 *
 * 규칙: `agent/frontend/guidelines/frontend_development_guidelines.md` §5
 * 엔드포인트: `client/src/lib/api/recipes.api`
 *
 * - 쿼리 키는 계층적으로 구성하여 부분 무효화를 쉽게 한다.
 *   (`['recipes']` → `['recipes','list',{...}]` → `['recipes','detail', id]` 등)
 * - `staleTime`/`gcTime`은 `QUERY_CACHE.recipeList` / `QUERY_CACHE.recipeDetail`을 사용한다.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import {
  getRecipeById,
  getRecipeList,
  getRecipeSummaries,
  searchRecipes,
  type RecipeListResult,
} from '@/lib/api/recipes.api';
import { QUERY_CACHE } from '@/lib/config/cache.config';
import type {
  RecipeDetail,
  RecipeListQuery,
  RecipeSearchQuery,
  RecipeSummary,
} from '@/lib/types/recipe';

// ─── 쿼리 키 ──────────────────────────────────────────────────────────────────

export const recipeQueries = {
  all: ['recipes'] as const,
  lists: () => [...recipeQueries.all, 'list'] as const,
  list: (params: RecipeListQuery) =>
    [...recipeQueries.lists(), params] as const,
  searches: () => [...recipeQueries.all, 'search'] as const,
  search: (params: RecipeSearchQuery) =>
    [...recipeQueries.searches(), params] as const,
  details: () => [...recipeQueries.all, 'detail'] as const,
  detail: (id: number) => [...recipeQueries.details(), id] as const,
  summaries: (ids: readonly number[]) =>
    [
      ...recipeQueries.all,
      'summaries',
      // 배열 순서에 무관하게 같은 키를 생성하도록 정렬한다.
      [...ids].sort((a, b) => a - b),
    ] as const,
} as const;

// ─── 공통 타입 ────────────────────────────────────────────────────────────────

type QueryOpts<TData> = Omit<
  UseQueryOptions<TData, Error, TData>,
  'queryKey' | 'queryFn'
>;

// ─── 훅 ───────────────────────────────────────────────────────────────────────

export function useRecipeList(
  params: RecipeListQuery = {},
  options?: QueryOpts<RecipeListResult>,
) {
  return useQuery<RecipeListResult, Error>({
    queryKey: recipeQueries.list(params),
    queryFn: () => getRecipeList(params),
    ...QUERY_CACHE.recipeList,
    ...options,
  });
}

export function useRecipeSearch(
  params: RecipeSearchQuery,
  options?: QueryOpts<RecipeListResult>,
) {
  return useQuery<RecipeListResult, Error>({
    queryKey: recipeQueries.search(params),
    queryFn: () => searchRecipes(params),
    ...QUERY_CACHE.recipeList,
    ...options,
  });
}

export function useRecipeDetail(
  id: number | null | undefined,
  options?: QueryOpts<RecipeDetail>,
) {
  const enabled =
    options?.enabled ?? (typeof id === 'number' && Number.isFinite(id));
  return useQuery<RecipeDetail, Error>({
    queryKey: recipeQueries.detail(id ?? 0),
    queryFn: () => getRecipeById(id as number),
    ...QUERY_CACHE.recipeDetail,
    ...options,
    enabled,
  });
}

export function useRecipeSummaries(
  ids: readonly number[],
  options?: QueryOpts<RecipeSummary[]>,
) {
  return useQuery<RecipeSummary[], Error>({
    queryKey: recipeQueries.summaries(ids),
    queryFn: () => getRecipeSummaries([...ids]),
    ...QUERY_CACHE.recipeList,
    ...options,
    enabled: (options?.enabled ?? true) && ids.length > 0,
  });
}
