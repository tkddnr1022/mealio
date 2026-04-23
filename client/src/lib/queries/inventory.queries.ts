'use client';

/**
 * 인벤토리(보유/관심) React Query 훅 모음.
 *
 * - 조회: `useMyInventory()`
 * - 변경 훅: 보유/즐겨찾기 각각 전체 교체·추가·단건 삭제 제공. 성공 시
 *   관련 리소스 쿼리를 invalidate하여 즉시 재조회한다.
 *
 * 캐시 정책은 짧게(`QUERY_CACHE.inventory`, 30초 fresh) 유지해 변경 반영이 빠르도록 한다.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import {
  getMyInventory,
  addMyOwnedIngredients,
  addMyFavoriteIngredients,
  removeMyFavoriteIngredient,
  removeMyOwnedIngredient,
  updateMyOwnedIngredients,
  updateMyFavoriteIngredients,
} from '@/lib/api/inventory.api';
import { QUERY_CACHE } from '@/lib/config/cache.config';
import type { MutationResult } from '@/lib/types/api';
import type { InventoryResponse } from '@/lib/types/inventory';

export const inventoryQueries = {
  all: ['inventory'] as const,
  overview: () => [...inventoryQueries.all, 'overview'] as const,
} as const;

type QueryOpts<TData> = Omit<
  UseQueryOptions<TData, Error, TData>,
  'queryKey' | 'queryFn'
>;

export function useMyInventory(
  options?: QueryOpts<InventoryResponse>,
) {
  return useQuery<InventoryResponse, Error>({
    queryKey: inventoryQueries.overview(),
    queryFn: () => getMyInventory(),
    ...QUERY_CACHE.inventory,
    ...options,
  });
}

function createInvalidatingMutationHook<TData, TVars>(
  mutationFn: (vars: TVars) => Promise<TData>,
  queryKey: readonly unknown[],
) {
  return (options?: UseMutationOptions<TData, Error, TVars>) => {
    const queryClient = useQueryClient();
    return useMutation<TData, Error, TVars>({
      mutationFn,
      ...options,
      onSuccess: (...args) => {
        void queryClient.invalidateQueries({
          queryKey,
        });
        options?.onSuccess?.(...args);
      },
    });
  };
}

export const useUpdateMyOwnedIngredients = createInvalidatingMutationHook<
  MutationResult,
  number[]
>(updateMyOwnedIngredients, inventoryQueries.all);

export const useAddMyOwnedIngredients = createInvalidatingMutationHook<
  MutationResult,
  number[]
>(addMyOwnedIngredients, inventoryQueries.all);

export const useRemoveMyOwnedIngredient = createInvalidatingMutationHook<
  void,
  number
>(removeMyOwnedIngredient, inventoryQueries.all);

export const useUpdateMyFavoriteIngredients = createInvalidatingMutationHook<
  MutationResult,
  number[]
>(updateMyFavoriteIngredients, inventoryQueries.all);

export const useAddMyFavoriteIngredients = createInvalidatingMutationHook<
  MutationResult,
  number[]
>(addMyFavoriteIngredients, inventoryQueries.all);

export const useRemoveMyFavoriteIngredient = createInvalidatingMutationHook<
  void,
  number
>(removeMyFavoriteIngredient, inventoryQueries.all);
