/**
 * 재료 API.
 *
 * 엔드포인트: `agent/backend/spec/backend_architecture_spec_producer.md` §1.1
 * - GET /api/v1/ingredients        → {@link getIngredientList}
 * - GET /api/v1/ingredients/search → {@link searchIngredients}
 *
 * 도메인 타입은 `@/lib/types/ingredient`에서 정의한다.
 */

import { httpClient } from './http-client';
import { objectToQuery } from './query';
import { API_ENDPOINTS } from './endpoints';
import type { Paginated } from '@/lib/types/api';
import type {
  Ingredient,
  IngredientListQuery,
  IngredientSearchQuery,
} from '@/lib/types/ingredient';

/** 재료 목록/검색 응답 shape (`Paginated<Ingredient>`) */
export type IngredientListResult = Paginated<Ingredient>;

/**
 * 재료 목록 조회 (카테고리 필터·페이지네이션).
 */
export function getIngredientList(
  params: IngredientListQuery = {},
): Promise<IngredientListResult> {
  return httpClient.get<IngredientListResult>(API_ENDPOINTS.ingredients.list, {
    query: objectToQuery(params),
  });
}

/**
 * 재료 검색 (키워드·카테고리 필터·페이지네이션).
 */
export function searchIngredients(
  params: IngredientSearchQuery = {},
): Promise<IngredientListResult> {
  return httpClient.get<IngredientListResult>(
    API_ENDPOINTS.ingredients.search,
    { query: objectToQuery(params) },
  );
}
