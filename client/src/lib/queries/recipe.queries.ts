'use client';

/**
 * 레시피 React Query 훅 모음.
 *
 * 규칙: `agent/frontend/guidelines/frontend_development_guidelines.md` §5
 * 엔드포인트: `client/src/lib/api/domains`
 *
 * - 쿼리 키는 계층적으로 구성하여 부분 무효화를 쉽게 한다.
 *   (`['recipes']` → `['recipes','list',{...}]` → `['recipes','detail', id]` 등)
 * - `staleTime`/`gcTime`은 `QUERY_CACHE.recipeList` / `QUERY_CACHE.recipeDetail`을 사용한다.
 */

import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type UseInfiniteQueryOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import {
  getRecipeById,
  getRecipeList,
  getRecipeSummaries,
  searchRecipes,
  type RecipeListResult,
} from '@/lib/api/domains';
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
  searchInfinite: (params: Omit<RecipeSearchQuery, 'page'>) =>
    [...recipeQueries.searches(), 'infinite', params] as const,
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
  const { meta: metaOption, ...rest } = options ?? {};
  return useQuery<RecipeListResult, Error>({
    queryKey: recipeQueries.list(params),
    queryFn: () => getRecipeList(params),
    ...QUERY_CACHE.recipeList,
    ...rest,
    meta: {
      errorToastTitle: '레시피 목록을 불러오지 못했어요',
      ...metaOption,
    },
  });
}

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
    queryFn: ({ pageParam }) =>
      searchRecipes({ ...params, page: pageParam }),
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

export function useRecipeSearch(
  params: RecipeSearchQuery,
  options?: QueryOpts<RecipeListResult>,
) {
  const { meta: metaOption, ...rest } = options ?? {};
  return useQuery<RecipeListResult, Error>({
    queryKey: recipeQueries.search(params),
    queryFn: () => searchRecipes(params),
    ...QUERY_CACHE.recipeList,
    ...rest,
    meta: {
      errorToastTitle: '레시피 검색 결과를 불러오지 못했어요',
      ...metaOption,
    },
  });
}

export function useRecipeDetail(
  id: number | null | undefined,
  options?: QueryOpts<RecipeDetail>,
) {
  const { meta: metaOption, ...rest } = options ?? {};
  const enabled =
    rest.enabled ?? (typeof id === 'number' && Number.isFinite(id));
  return useQuery<RecipeDetail, Error>({
    queryKey: recipeQueries.detail(id ?? 0),
    queryFn: () => getRecipeById(id as number),
    ...QUERY_CACHE.recipeDetail,
    ...rest,
    enabled,
    meta: {
      errorToastTitle: '레시피를 불러오지 못했어요',
      ...metaOption,
    },
  });
}

export function useRecipeSummaries(
  ids: readonly number[],
  options?: QueryOpts<RecipeSummary[]>,
) {
  const { meta: metaOption, ...rest } = options ?? {};
  return useQuery<RecipeSummary[], Error>({
    queryKey: recipeQueries.summaries(ids),
    queryFn: () => getRecipeSummaries([...ids]),
    ...QUERY_CACHE.recipeList,
    ...rest,
    enabled: (rest.enabled ?? true) && ids.length > 0,
    meta: {
      errorToastTitle: '레시피 요약을 불러오지 못했어요',
      ...metaOption,
    },
  });
}
