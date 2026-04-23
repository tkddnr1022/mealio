/**
 * 인벤토리 API.
 *
 * 엔드포인트: `agent/backend/spec/backend_architecture_spec_producer.md` §1.1
 * (`InventoryController` - `/api/v1/users/me/inventory/ingredients`)
 *
 * - GET  /api/v1/users/me/inventory/ingredients                      -> {@link getMyInventory}
 * - PUT  /api/v1/users/me/inventory/ingredients/owned                -> {@link updateMyOwnedIngredients}
 * - POST /api/v1/users/me/inventory/ingredients/owned                -> {@link addMyOwnedIngredients}
 * - DELETE /api/v1/users/me/inventory/ingredients/owned/:id          -> {@link removeMyOwnedIngredient}
 * - PUT  /api/v1/users/me/inventory/ingredients/favorites            -> {@link updateMyFavoriteIngredients}
 * - POST /api/v1/users/me/inventory/ingredients/favorites            -> {@link addMyFavoriteIngredients}
 * - DELETE /api/v1/users/me/inventory/ingredients/favorites/:id      -> {@link removeMyFavoriteIngredient}
 *
 * 도메인 타입은 `@/lib/types/inventory`에서 정의한다.
 */

import { httpClient } from './http-client';
import { API_ENDPOINTS } from './endpoints';
import type { MutationResult } from '@/lib/types/api';
import type { InventoryResponse } from '@/lib/types/inventory';

export function getMyInventory(): Promise<InventoryResponse> {
  return httpClient.get<InventoryResponse>(API_ENDPOINTS.users.meInventory);
}

export function updateMyOwnedIngredients(
  ownedIngredientIds: number[],
): Promise<MutationResult> {
  return httpClient.put<MutationResult>(API_ENDPOINTS.users.meInventoryOwned, {
    ownedIngredientIds,
  });
}

export function addMyOwnedIngredients(
  ownedIngredientIds: number[],
): Promise<MutationResult> {
  return httpClient.post<MutationResult>(API_ENDPOINTS.users.meInventoryOwned, {
    ownedIngredientIds,
  });
}

export function removeMyOwnedIngredient(ingredientId: number): Promise<void> {
  return httpClient.delete<void>(
    API_ENDPOINTS.users.meInventoryOwnedDetail(ingredientId),
  );
}

export function updateMyFavoriteIngredients(
  favoriteIngredientIds: number[],
): Promise<MutationResult> {
  return httpClient.put<MutationResult>(
    API_ENDPOINTS.users.meInventoryFavorites,
    { favoriteIngredientIds },
  );
}

export function addMyFavoriteIngredients(
  favoriteIngredientIds: number[],
): Promise<MutationResult> {
  return httpClient.post<MutationResult>(
    API_ENDPOINTS.users.meInventoryFavorites,
    { favoriteIngredientIds },
  );
}

export function removeMyFavoriteIngredient(ingredientId: number): Promise<void> {
  return httpClient.delete<void>(
    API_ENDPOINTS.users.meInventoryFavoriteDetail(ingredientId),
  );
}
