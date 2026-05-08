/**
 * 인벤토리 API.
 *
 * 엔드포인트: `agent/backend/spec/backend_architecture_spec_producer.md` §1.1
 * (`InventoryController` - `/api/v1/users/me/inventory`)
 *
 * - GET  /api/v1/users/me/inventory                                  -> {@link getMyInventory}
 * - PUT  /api/v1/users/me/inventory/ingredients/owned                -> {@link updateMyOwnedIngredients}
 * - POST /api/v1/users/me/inventory/ingredients/owned                -> {@link addMyOwnedIngredients}
 * - DELETE /api/v1/users/me/inventory/ingredients/owned/:id          -> {@link removeMyOwnedIngredient}
 * - PUT  /api/v1/users/me/inventory/ingredients/favorites            -> {@link updateMyFavoriteIngredients}
 * - POST /api/v1/users/me/inventory/ingredients/favorites            -> {@link addMyFavoriteIngredients}
 * - DELETE /api/v1/users/me/inventory/ingredients/favorites/:id      -> {@link removeMyFavoriteIngredient}
 * - POST /api/v1/users/me/inventory/recipes/favorites                 -> {@link addMyFavoriteRecipes}
 * - DELETE /api/v1/users/me/inventory/recipes/favorites/:id          -> {@link removeMyFavoriteRecipe}
 * - GET  /api/v1/users/me/favorite-recipes/ids                       -> {@link getMyFavoriteRecipeIds}
 *
 * 도메인 타입은 `@/lib/types/inventory`에서 정의한다.
 */

import { httpClient, type RequestOptions } from '../http-client';
import { API_ENDPOINTS } from '../endpoints';
import type { MutationResult } from '@/lib/types/api';
import type {
  FavoriteRecipeIdsResponse,
  InventoryResponse,
} from '@/lib/types/inventory';

export function getMyInventory(
  fetchOptions?: RequestOptions,
): Promise<InventoryResponse> {
  return httpClient.get<InventoryResponse>(
    API_ENDPOINTS.users.meInventory,
    fetchOptions,
  );
}

/**
 * 내 관심 레시피 ID 목록만 조회 (`RecipeSummary`와 분리된 개인화 데이터).
 */
export function getMyFavoriteRecipeIds(
  fetchOptions?: RequestOptions,
): Promise<FavoriteRecipeIdsResponse> {
  return httpClient.get<FavoriteRecipeIdsResponse>(
    API_ENDPOINTS.users.meFavoriteRecipeIds,
    fetchOptions,
  );
}

export function updateMyOwnedIngredients(
  ownedIngredientIds: number[],
  fetchOptions?: RequestOptions,
): Promise<MutationResult> {
  return httpClient.put<MutationResult>(
    API_ENDPOINTS.users.meInventoryOwned,
    { ownedIngredientIds },
    fetchOptions,
  );
}

export function addMyOwnedIngredients(
  ownedIngredientIds: number[],
  fetchOptions?: RequestOptions,
): Promise<MutationResult> {
  return httpClient.post<MutationResult>(
    API_ENDPOINTS.users.meInventoryOwned,
    { ownedIngredientIds },
    fetchOptions,
  );
}

export function removeMyOwnedIngredient(
  ingredientId: number,
  fetchOptions?: RequestOptions,
): Promise<void> {
  return httpClient.delete<void>(
    API_ENDPOINTS.users.meInventoryOwnedDetail(ingredientId),
    fetchOptions,
  );
}

export function updateMyFavoriteIngredients(
  favoriteIngredientIds: number[],
  fetchOptions?: RequestOptions,
): Promise<MutationResult> {
  return httpClient.put<MutationResult>(
    API_ENDPOINTS.users.meInventoryFavorites,
    { favoriteIngredientIds },
    fetchOptions,
  );
}

export function addMyFavoriteIngredients(
  favoriteIngredientIds: number[],
  fetchOptions?: RequestOptions,
): Promise<MutationResult> {
  return httpClient.post<MutationResult>(
    API_ENDPOINTS.users.meInventoryFavorites,
    { favoriteIngredientIds },
    fetchOptions,
  );
}

export function removeMyFavoriteIngredient(
  ingredientId: number,
  fetchOptions?: RequestOptions,
): Promise<void> {
  return httpClient.delete<void>(
    API_ENDPOINTS.users.meInventoryFavoriteDetail(ingredientId),
    fetchOptions,
  );
}

export function addMyFavoriteRecipes(
  favoriteRecipeIds: number[],
  fetchOptions?: RequestOptions,
): Promise<MutationResult> {
  return httpClient.post<MutationResult>(
    API_ENDPOINTS.users.meInventoryRecipeFavorites,
    { favoriteRecipeIds },
    fetchOptions,
  );
}

export function removeMyFavoriteRecipe(
  recipeId: number,
  fetchOptions?: RequestOptions,
): Promise<void> {
  return httpClient.delete<void>(
    API_ENDPOINTS.users.meInventoryRecipeFavoritesDetail(recipeId),
    fetchOptions,
  );
}
