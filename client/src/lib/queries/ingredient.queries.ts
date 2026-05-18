'use client';

/**
 * 재료(마스터) React Query 훅 모음.
 *
 * 재료 데이터는 거의 변하지 않으므로 `QUERY_CACHE.ingredient`(1시간 fresh)로 길게 캐싱한다.
 */

import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
  type UseInfiniteQueryOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import {
  getIngredientCategories,
  getIngredientList,
  searchIngredients,
  type IngredientListResult,
} from '@/lib/api/domains';
import { QUERY_CACHE } from '@/lib/config/cache.config';
import type {
  IngredientCategory,
  IngredientListQuery,
  IngredientSearchQuery,
} from '@/lib/types/ingredient';

// ─── 쿼리 키 ──────────────────────────────────────────────────────────────────

export const ingredientQueries = {
  all: ['ingredients'] as const,
  categories: () => [...ingredientQueries.all, 'categories'] as const,
  lists: () => [...ingredientQueries.all, 'list'] as const,
  list: (params: IngredientListQuery) =>
    [...ingredientQueries.lists(), params] as const,
  searches: () => [...ingredientQueries.all, 'search'] as const,
  search: (params: IngredientSearchQuery) =>
    [...ingredientQueries.searches(), params] as const,
  searchInfinite: (params: Omit<IngredientSearchQuery, 'page'>) =>
    [...ingredientQueries.searches(), 'infinite', params] as const,
} as const;

// ─── 공통 타입 ────────────────────────────────────────────────────────────────

type QueryOpts<TData> = Omit<
  UseQueryOptions<TData, Error, TData>,
  'queryKey' | 'queryFn'
>;

// ─── 훅 ───────────────────────────────────────────────────────────────────────

export function useIngredientCategories(
  options?: QueryOpts<IngredientCategory[]>,
) {
  const { meta: metaOption, ...rest } = options ?? {};
  return useQuery<IngredientCategory[], Error>({
    queryKey: ingredientQueries.categories(),
    queryFn: async () => {
      const result = await getIngredientCategories();
      return result.data;
    },
    ...QUERY_CACHE.ingredient,
    ...rest,
    meta: {
      errorToastTitle: '재료 카테고리를 불러오지 못했어요',
      ...metaOption,
    },
  });
}

export function useIngredientList(
  params: IngredientListQuery = {},
  options?: QueryOpts<IngredientListResult>,
) {
  const { meta: metaOption, ...rest } = options ?? {};
  return useQuery<IngredientListResult, Error>({
    queryKey: ingredientQueries.list(params),
    queryFn: () => getIngredientList(params),
    ...QUERY_CACHE.ingredient,
    ...rest,
    meta: {
      errorToastTitle: '재료 목록을 불러오지 못했어요',
      ...metaOption,
    },
  });
}

export function useIngredientSearchInfinite(
  params: Omit<IngredientSearchQuery, 'page'>,
  options?: Omit<
    UseInfiniteQueryOptions<
      IngredientListResult,
      Error,
      InfiniteData<IngredientListResult>,
      ReturnType<typeof ingredientQueries.searchInfinite>,
      number
    >,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  >,
) {
  const { meta: metaOption, ...rest } = options ?? {};
  return useInfiniteQuery({
    queryKey: ingredientQueries.searchInfinite(params),
    queryFn: ({ pageParam }) =>
      searchIngredients({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    ...QUERY_CACHE.ingredient,
    ...rest,
    meta: {
      errorToastTitle: '재료 검색 결과를 불러오지 못했어요',
      ...metaOption,
    },
  });
}

export function useIngredientSearch(
  params: IngredientSearchQuery,
  options?: QueryOpts<IngredientListResult>,
) {
  const { meta: metaOption, ...rest } = options ?? {};
  return useQuery<IngredientListResult, Error>({
    queryKey: ingredientQueries.search(params),
    queryFn: () => searchIngredients(params),
    ...QUERY_CACHE.ingredient,
    ...rest,
    meta: {
      errorToastTitle: '재료 검색 결과를 불러오지 못했어요',
      ...metaOption,
    },
  });
}
