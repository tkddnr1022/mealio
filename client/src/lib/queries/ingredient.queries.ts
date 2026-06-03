'use client';

/**
 * 재료(마스터) React Query 훅 모음.
 *
 * 재료 데이터는 거의 변하지 않으므로 `QUERY_CACHE.ingredient`(1시간 fresh)로 길게 캐싱한다.
 */

import {
  useInfiniteQuery,
  type InfiniteData,
  type UseInfiniteQueryOptions,
} from '@tanstack/react-query';

import {
  searchIngredients,
  type IngredientListResult,
} from '@/lib/api/domains';
import { QUERY_CACHE } from '@/lib/policy/cache.policy';
import type { IngredientSearchQuery } from '@/lib/types/ingredient';

// ─── 쿼리 키 ──────────────────────────────────────────────────────────────────

export const ingredientQueries = {
  all: ['ingredients'] as const,
  categories: () => [...ingredientQueries.all, 'categories'] as const,
  searches: () => [...ingredientQueries.all, 'search'] as const,
  searchInfinite: (params: Omit<IngredientSearchQuery, 'page'>) =>
    [...ingredientQueries.searches(), 'infinite', params] as const,
} as const;

// ─── 훅 ───────────────────────────────────────────────────────────────────────

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
