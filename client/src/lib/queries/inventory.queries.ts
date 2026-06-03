'use client';

/**
 * 인벤토리(보유/관심) React Query 훅 모음.
 *
 * 조회: `useMyInventory()`, `useMyFavoriteRecipeIds()`
 *
 * 변경(command):
 * - 결과가 예측 가능한 command(삭제·토글)는 캐시를 직접 optimistic update하고,
 *   성공 시 stale 마킹만 수행한다(`refetchType: 'none'`).
 * - 결과를 예측하기 어려운 command(추가·전체 교체)는 성공 시 stale 마킹만 한다.
 *
 * Producer-Consumer 구조상 command API 성공이 DB 반영 완료를 보장하지 않으므로,
 * 성공 시 즉시 재조회(refetch)를 하지 않는다.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import {
  getMyInventory,
  getMyFavoriteRecipeIds,
  addMyOwnedIngredients,
  addMyFavoriteIngredients,
  addMyFavoriteRecipes,
  removeMyFavoriteIngredient,
  removeMyFavoriteRecipe,
  removeMyOwnedIngredient,
  updateMyOwnedIngredients,
  updateMyFavoriteIngredients,
} from '@/lib/api/domains';
import { QUERY_CACHE } from '@/lib/policy/cache.policy';
import type { MutationResult } from '@/lib/types/api';
import type {
  FavoriteRecipeIdsResponse,
  InventoryResponse,
} from '@/lib/types/inventory';

export const inventoryQueries = {
  all: ['inventory'] as const,
  overview: () => [...inventoryQueries.all, 'overview'] as const,
} as const;

/** 관심 레시피 ID 전용 쿼리 키 (`GET .../favorite-recipes/ids`) */
export const favoriteRecipeQueries = {
  all: ['favoriteRecipes'] as const,
  ids: () => [...favoriteRecipeQueries.all, 'ids'] as const,
} as const;

type QueryOpts<TData> = Omit<
  UseQueryOptions<TData, Error, TData>,
  'queryKey' | 'queryFn'
>;

// ─── 조회 ─────────────────────────────────────────────

export function useMyInventory(options?: QueryOpts<InventoryResponse>) {
  const { meta: metaOption, ...rest } = options ?? {};
  return useQuery<InventoryResponse, Error>({
    queryKey: inventoryQueries.overview(),
    queryFn: () => getMyInventory(),
    ...QUERY_CACHE.inventory,
    ...rest,
    meta: {
      errorToastTitle: '보관함을 불러오지 못했어요',
      ...metaOption,
    },
  });
}

export function useMyFavoriteRecipeIds(
  options?: QueryOpts<FavoriteRecipeIdsResponse>,
) {
  const { meta: metaOption, ...rest } = options ?? {};
  return useQuery<FavoriteRecipeIdsResponse, Error>({
    queryKey: favoriteRecipeQueries.ids(),
    queryFn: () => getMyFavoriteRecipeIds(),
    ...QUERY_CACHE.inventory,
    ...rest,
    meta: {
      errorToastTitle: '관심 레시피를 불러오지 못했어요',
      ...metaOption,
    },
  });
}

// ─── 캐시 stale 마킹 헬퍼 ─────────────────────────────

function staleInventory(qc: QueryClient) {
  void qc.invalidateQueries({
    queryKey: inventoryQueries.all,
    refetchType: 'none',
  });
}

function staleInventoryAndFavoriteRecipes(qc: QueryClient) {
  staleInventory(qc);
  void qc.invalidateQueries({
    queryKey: favoriteRecipeQueries.all,
    refetchType: 'none',
  });
}

// ─── Optimistic update 뮤테이션 (예측 가능한 command) ──

export function useRemoveMyOwnedIngredient(
  options?: UseMutationOptions<void, Error, number>,
) {
  const qc = useQueryClient();
  const { meta: metaOption, ...rest } = options ?? {};
  return useMutation<void, Error, number, { previous?: InventoryResponse }>({
    mutationFn: (id) => removeMyOwnedIngredient(id),
    ...rest,
    meta: {
      errorToastTitle: '보유 재료를 삭제하지 못했어요',
      ...metaOption,
    },
    onMutate: async (ingredientId) => {
      await qc.cancelQueries({ queryKey: inventoryQueries.overview() });
      const previous = qc.getQueryData<InventoryResponse>(
        inventoryQueries.overview(),
      );
      qc.setQueryData<InventoryResponse>(inventoryQueries.overview(), (old) =>
        old
          ? {
              ...old,
              ownedIngredients: old.ownedIngredients.filter(
                (i) => i.id !== ingredientId,
              ),
            }
          : old,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(inventoryQueries.overview(), ctx.previous);
    },
    onSuccess: () => staleInventory(qc),
  });
}

export function useRemoveMyFavoriteIngredient(
  options?: UseMutationOptions<void, Error, number>,
) {
  const qc = useQueryClient();
  const { meta: metaOption, ...rest } = options ?? {};
  return useMutation<void, Error, number, { previous?: InventoryResponse }>({
    mutationFn: (id) => removeMyFavoriteIngredient(id),
    ...rest,
    meta: {
      errorToastTitle: '관심 재료를 삭제하지 못했어요',
      ...metaOption,
    },
    onMutate: async (ingredientId) => {
      await qc.cancelQueries({ queryKey: inventoryQueries.overview() });
      const previous = qc.getQueryData<InventoryResponse>(
        inventoryQueries.overview(),
      );
      qc.setQueryData<InventoryResponse>(inventoryQueries.overview(), (old) =>
        old
          ? {
              ...old,
              favoriteIngredients: old.favoriteIngredients.filter(
                (i) => i.id !== ingredientId,
              ),
            }
          : old,
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(inventoryQueries.overview(), ctx.previous);
    },
    onSuccess: () => staleInventory(qc),
  });
}

export interface ToggleMyFavoriteRecipeVariables {
  recipeId: number;
  /** 토글 전 현재 찜 상태. `true`이면 찜 해제, `false`이면 찜 추가. */
  isFavorite: boolean;
}

export function useToggleMyFavoriteRecipe(
  options?: UseMutationOptions<void, Error, ToggleMyFavoriteRecipeVariables>,
) {
  const { meta: metaOption, ...rest } = options ?? {};
  const qc = useQueryClient();

  return useMutation<
    void,
    Error,
    ToggleMyFavoriteRecipeVariables,
    { previous?: FavoriteRecipeIdsResponse }
  >({
    mutationFn: async ({ recipeId, isFavorite }) => {
      if (isFavorite) {
        await removeMyFavoriteRecipe(recipeId);
        return;
      }
      await addMyFavoriteRecipes([recipeId]);
    },
    ...rest,
    meta: {
      errorToastTitle: '관심 레시피를 변경하지 못했어요',
      ...metaOption,
    },
    onMutate: async ({ recipeId, isFavorite }) => {
      await qc.cancelQueries({ queryKey: inventoryQueries.overview() });
      await qc.cancelQueries({ queryKey: favoriteRecipeQueries.ids() });

      const previous = qc.getQueryData<FavoriteRecipeIdsResponse>(
        favoriteRecipeQueries.ids(),
      );

      qc.setQueryData<FavoriteRecipeIdsResponse>(
        favoriteRecipeQueries.ids(),
        (old) => {
          if (!old) return old;
          const ids = isFavorite
            ? old.favoriteRecipeIds.filter((id) => id !== recipeId)
            : [...old.favoriteRecipeIds, recipeId];
          return { favoriteRecipeIds: ids };
        },
      );

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous)
        qc.setQueryData(favoriteRecipeQueries.ids(), ctx.previous);
    },
    onSuccess: () => staleInventoryAndFavoriteRecipes(qc),
  });
}

// ─── Stale-only 뮤테이션 (예측 불가 command) ──────────

function createStalingMutationHook<TData, TVars>(
  mutFn: (vars: TVars) => Promise<TData>,
  markStale: (qc: QueryClient) => void,
  errorMeta: { errorToastTitle: string },
) {
  return (options?: UseMutationOptions<TData, Error, TVars>) => {
    const qc = useQueryClient();
    const { meta: metaOption, ...rest } = options ?? {};
    return useMutation<TData, Error, TVars>({
      mutationFn: mutFn,
      ...rest,
      meta: {
        ...errorMeta,
        ...metaOption,
      },
      onSuccess: (...args) => {
        markStale(qc);
        rest.onSuccess?.(...args);
      },
    });
  };
}

export const useUpdateMyOwnedIngredients = createStalingMutationHook<
  MutationResult,
  number[]
>(updateMyOwnedIngredients, staleInventory, {
  errorToastTitle: '보유 재료를 저장하지 못했어요',
});

export const useAddMyOwnedIngredients = createStalingMutationHook<
  MutationResult,
  number[]
>(addMyOwnedIngredients, staleInventory, {
  errorToastTitle: '보유 재료를 추가하지 못했어요',
});

export const useUpdateMyFavoriteIngredients = createStalingMutationHook<
  MutationResult,
  number[]
>(updateMyFavoriteIngredients, staleInventory, {
  errorToastTitle: '관심 재료를 저장하지 못했어요',
});

export const useAddMyFavoriteIngredients = createStalingMutationHook<
  MutationResult,
  number[]
>(addMyFavoriteIngredients, staleInventory, {
  errorToastTitle: '관심 재료를 추가하지 못했어요',
});

export const useAddMyFavoriteRecipes = createStalingMutationHook<
  MutationResult,
  number[]
>(addMyFavoriteRecipes, staleInventoryAndFavoriteRecipes, {
  errorToastTitle: '관심 레시피를 추가하지 못했어요',
});
