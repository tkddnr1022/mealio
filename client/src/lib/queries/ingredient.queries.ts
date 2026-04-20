'use client';

/**
 * 재료(마스터) React Query 훅 모음.
 *
 * 재료 데이터는 거의 변하지 않으므로 `QUERY_CACHE.ingredient`(1시간 fresh)로 길게 캐싱한다.
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import {
  getIngredientList,
  searchIngredients,
  type IngredientListResult,
} from '@/lib/api/ingredients.api';
import { QUERY_CACHE } from '@/lib/config/cache.config';
import type {
  IngredientListQuery,
  IngredientSearchQuery,
} from '@/lib/types/ingredient';

// ─── 쿼리 키 ──────────────────────────────────────────────────────────────────

export const ingredientQueries = {
  all: ['ingredients'] as const,
  lists: () => [...ingredientQueries.all, 'list'] as const,
  list: (params: IngredientListQuery) =>
    [...ingredientQueries.lists(), params] as const,
  searches: () => [...ingredientQueries.all, 'search'] as const,
  search: (params: IngredientSearchQuery) =>
    [...ingredientQueries.searches(), params] as const,
} as const;

// ─── 공통 타입 ────────────────────────────────────────────────────────────────

type QueryOpts<TData> = Omit<
  UseQueryOptions<TData, Error, TData>,
  'queryKey' | 'queryFn'
>;

// ─── 훅 ───────────────────────────────────────────────────────────────────────

export function useIngredientList(
  params: IngredientListQuery = {},
  options?: QueryOpts<IngredientListResult>,
) {
  return useQuery<IngredientListResult, Error>({
    queryKey: ingredientQueries.list(params),
    queryFn: () => getIngredientList(params),
    ...QUERY_CACHE.ingredient,
    ...options,
  });
}

export function useIngredientSearch(
  params: IngredientSearchQuery,
  options?: QueryOpts<IngredientListResult>,
) {
  return useQuery<IngredientListResult, Error>({
    queryKey: ingredientQueries.search(params),
    queryFn: () => searchIngredients(params),
    ...QUERY_CACHE.ingredient,
    ...options,
  });
}
