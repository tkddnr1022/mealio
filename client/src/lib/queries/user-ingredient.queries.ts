'use client';

/**
 * 유저 재료함(보유/관심) React Query 훅 모음.
 *
 * - 조회: `useMyIngredients()` → `{ ingredients, favoriteIngredients }` 한 번에 반환.
 * - 변경 훅: 보유/즐겨찾기 각각 전체 교체·추가·단건 삭제 제공. 성공 시
 *   `userIngredientQueries.all` 전체를 invalidate하여 즉시 재조회한다.
 *
 * 캐시 정책은 짧게(`QUERY_CACHE.userIngredient`, 30초 fresh) 유지해 변경 반영이 빠르도록 한다.
 *
 * 구현 메모:
 * - 보유/즐겨찾기의 모든 변경 훅은 동일한 패턴(요청 → 성공 시 전체 invalidate)이므로
 *   {@link createInvalidatingMutationHook} 팩토리로 보일러플레이트를 제거했다.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import {
  addMyFavorites,
  addMyIngredients,
  getMyIngredients,
  removeMyFavorite,
  removeMyIngredient,
  updateMyFavorites,
  updateMyIngredients,
} from '@/lib/api/user-ingredients.api';
import { QUERY_CACHE } from '@/lib/config/cache.config';
import type { MutationResult } from '@/lib/types/api';
import type { UserIngredientList } from '@/lib/types/user-ingredient';

// ─── 쿼리 키 ──────────────────────────────────────────────────────────────────

export const userIngredientQueries = {
  all: ['user-ingredients'] as const,
  list: () => [...userIngredientQueries.all, 'list'] as const,
} as const;

// ─── 공통 타입 ────────────────────────────────────────────────────────────────

type QueryOpts<TData> = Omit<
  UseQueryOptions<TData, Error, TData>,
  'queryKey' | 'queryFn'
>;

// ─── 조회 훅 ──────────────────────────────────────────────────────────────────

export function useMyIngredients(options?: QueryOpts<UserIngredientList>) {
  return useQuery<UserIngredientList, Error>({
    queryKey: userIngredientQueries.list(),
    queryFn: () => getMyIngredients(),
    ...QUERY_CACHE.userIngredient,
    ...options,
  });
}

// ─── 팩토리 ────────────────────────────────────────────────────────────────────

/**
 * "성공 시 재료함 캐시 전체 invalidate" 패턴을 공유하는 mutation 훅 팩토리.
 *
 * @param mutationFn  실제 API 호출 함수 (`(vars) => Promise<TData>`)
 * @returns 동일 시그니처 `(options?) => useMutation(...)` 훅
 */
function createInvalidatingMutationHook<TData, TVars>(
  mutationFn: (vars: TVars) => Promise<TData>,
) {
  return (options?: UseMutationOptions<TData, Error, TVars>) => {
    const queryClient = useQueryClient();
    return useMutation<TData, Error, TVars>({
      mutationFn,
      ...options,
      onSuccess: (...args) => {
        void queryClient.invalidateQueries({
          queryKey: userIngredientQueries.all,
        });
        options?.onSuccess?.(...args);
      },
    });
  };
}

// ─── 변경 훅 (보유 재료) ────────────────────────────────────────────────────────

export const useUpdateMyIngredients = createInvalidatingMutationHook<
  MutationResult,
  number[]
>(updateMyIngredients);

export const useAddMyIngredients = createInvalidatingMutationHook<
  MutationResult,
  number[]
>(addMyIngredients);

export const useRemoveMyIngredient = createInvalidatingMutationHook<
  void,
  number
>(removeMyIngredient);

// ─── 변경 훅 (즐겨찾기 재료) ────────────────────────────────────────────────────

export const useUpdateMyFavorites = createInvalidatingMutationHook<
  MutationResult,
  number[]
>(updateMyFavorites);

export const useAddMyFavorites = createInvalidatingMutationHook<
  MutationResult,
  number[]
>(addMyFavorites);

export const useRemoveMyFavorite = createInvalidatingMutationHook<
  void,
  number
>(removeMyFavorite);
