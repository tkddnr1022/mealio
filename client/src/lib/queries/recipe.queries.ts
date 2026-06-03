'use client';

/**
 * 레시피 React Query 훅 모음.
 *
 * 규칙: `agent/frontend/guidelines/frontend_development_guidelines.md` §5
 * 엔드포인트: `client/src/lib/api/domains`
 *
 * - 쿼리 키는 계층적으로 구성하여 부분 무효화를 쉽게 한다.
 *   (`['recipes']` → `['recipes','list',{...}]` → `['recipes','detail', id]` 등)
 * - `staleTime`/`gcTime`은 `QUERY_CACHE.recipeList` / `QUERY_CACHE.recommended` 등을 사용한다.
 */

import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type UseInfiniteQueryOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import {
  getRecommendedRecipes,
  searchRecipes,
  type RecipeListResult,
} from '@/lib/api/domains';
import { QUERY_CACHE } from '@/lib/policy/cache.policy';
import type {
  RecipeRecommendationItem,
  RecipeSearchQuery,
  RecommendedRecipesQuery,
} from '@/lib/types/recipe';

// ─── 쿼리 키 ──────────────────────────────────────────────────────────────────

export const recipeQueries = {
  all: ['recipes'] as const,
  lists: () => [...recipeQueries.all, 'list'] as const,
  searches: () => [...recipeQueries.all, 'search'] as const,
  searchInfinite: (params: Omit<RecipeSearchQuery, 'page'>) =>
    [...recipeQueries.searches(), 'infinite', params] as const,
  recommended: (params: RecommendedRecipesQuery) =>
    [...recipeQueries.all, 'recommended', params] as const,
} as const;

// ─── 공통 타입 ────────────────────────────────────────────────────────────────

type QueryOpts<TData> = Omit<
  UseQueryOptions<TData, Error, TData>,
  'queryKey' | 'queryFn'
>;

// ─── 훅 ───────────────────────────────────────────────────────────────────────

export function useRecipeSearchInfinite(
  params: Omit<RecipeSearchQuery, 'page'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      RecipeListResult,
      Error,
      InfiniteData<RecipeListResult>,
      ReturnType<typeof recipeQueries.searchInfinite>,
      number
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >,
) {
  const { meta: metaOption, ...rest } = options ?? {};
  return useInfiniteQuery({
    queryKey: recipeQueries.searchInfinite(params),
    queryFn: ({ pageParam }) => searchRecipes({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    ...QUERY_CACHE.recipeList,
    ...rest,
    meta: {
      errorToastTitle: '레시피 검색 결과를 불러오지 못했어요',
      ...metaOption,
    },
  });
}

export function useRecommendedRecipes(
  params: RecommendedRecipesQuery = {},
  options?: QueryOpts<{ data: RecipeRecommendationItem[] }>,
) {
  const { meta: metaOption, ...rest } = options ?? {};
  return useQuery<{ data: RecipeRecommendationItem[] }, Error>({
    queryKey: recipeQueries.recommended(params),
    queryFn: () => getRecommendedRecipes(params),
    ...QUERY_CACHE.recommended,
    ...rest,
    meta: {
      errorToastTitle: '맞춤 레시피를 불러오지 못했어요',
      ...metaOption,
    },
  });
}
