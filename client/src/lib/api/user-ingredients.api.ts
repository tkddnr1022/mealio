/**
 * 유저 재료함 API.
 *
 * 엔드포인트: `agent/backend/spec/backend_architecture_spec_producer.md` §1.1
 * (`UserIngredientsController` — `GET/PUT/POST/DELETE /api/v1/users/me/ingredients`)
 *
 * - GET  /api/v1/users/me/ingredients                    → {@link getMyIngredients}
 * - PUT  /api/v1/users/me/ingredients                    → {@link updateMyIngredients}   (전체 교체)
 * - POST /api/v1/users/me/ingredients                    → {@link addMyIngredients}      (추가)
 * - DELETE /api/v1/users/me/ingredients/:id              → {@link removeMyIngredient}    (단건 삭제)
 * - PUT  /api/v1/users/me/ingredients/favorites          → {@link updateMyFavorites}     (즐겨찾기 전체 교체)
 * - POST /api/v1/users/me/ingredients/favorites          → {@link addMyFavorites}        (즐겨찾기 추가)
 * - DELETE /api/v1/users/me/ingredients/favorites/:id   → {@link removeMyFavorite}      (즐겨찾기 단건 삭제)
 *
 * 도메인 타입은 `@/lib/types/user-ingredient`에서 정의한다.
 */

import { httpClient } from './http-client';
import { API_ENDPOINTS } from './endpoints';
import type { MutationResult } from '@/lib/types/api';
import type { UserIngredientList } from '@/lib/types/user-ingredient';

// ─── API 함수 ──────────────────────────────────────────────────────────────────

/**
 * 내 재료함 전체 조회 (보유 재료 + 즐겨찾기 재료).
 */
export function getMyIngredients(): Promise<UserIngredientList> {
  return httpClient.get<UserIngredientList>(API_ENDPOINTS.users.meIngredients);
}

/**
 * 보유 재료 목록을 전체 교체한다.
 * `ingredientIds`에 없는 기존 재료는 삭제되고, 새 목록으로 덮어쓴다.
 */
export function updateMyIngredients(
  ingredientIds: number[],
): Promise<MutationResult> {
  return httpClient.put<MutationResult>(API_ENDPOINTS.users.meIngredients, {
    ingredientIds,
  });
}

/**
 * 보유 재료를 추가한다 (기존 목록에 병합).
 */
export function addMyIngredients(
  ingredientIds: number[],
): Promise<MutationResult> {
  return httpClient.post<MutationResult>(API_ENDPOINTS.users.meIngredients, {
    ingredientIds,
  });
}

/**
 * 보유 재료 단건 삭제.
 */
export function removeMyIngredient(ingredientId: number): Promise<void> {
  return httpClient.delete<void>(
    API_ENDPOINTS.users.meIngredientDetail(ingredientId),
  );
}

/**
 * 즐겨찾기 재료 목록을 전체 교체한다.
 */
export function updateMyFavorites(
  ingredientIds: number[],
): Promise<MutationResult> {
  return httpClient.put<MutationResult>(
    API_ENDPOINTS.users.meIngredientFavorites,
    { ingredientIds },
  );
}

/**
 * 즐겨찾기 재료를 추가한다 (기존 목록에 병합).
 */
export function addMyFavorites(
  ingredientIds: number[],
): Promise<MutationResult> {
  return httpClient.post<MutationResult>(
    API_ENDPOINTS.users.meIngredientFavorites,
    { ingredientIds },
  );
}

/**
 * 즐겨찾기 재료 단건 삭제.
 */
export function removeMyFavorite(ingredientId: number): Promise<void> {
  return httpClient.delete<void>(
    API_ENDPOINTS.users.meIngredientFavoriteDetail(ingredientId),
  );
}
