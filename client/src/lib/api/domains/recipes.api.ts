/**
 * 레시피 API.
 *
 * 엔드포인트: `agent/backend/spec/backend_architecture_spec_producer.md` §1.1
 * - GET  /api/v1/recipes              → {@link getRecipeList}
 * - GET  /api/v1/recipes/recommended  → {@link getRecommendedRecipes}
 * - GET  /api/v1/recipes/static-ids   → {@link getRecipeStaticIds}
 * - GET  /api/v1/recipes/categories   → {@link getRecipeCategories}
 * - GET  /api/v1/recipes/search       → {@link searchRecipes}
 * - GET  /api/v1/recipes/:recipeId    → {@link getRecipeById}
 * - POST /api/v1/recipes/summaries    → {@link getRecipeSummaries}
 *
 * 도메인 타입은 `@/lib/types/recipe`에서 정의한다.
 */

import { httpClient, type RequestOptions } from '../http-client';
import { objectToQuery } from '../query';
import { API_ENDPOINTS } from '../endpoints';
import type { Paginated } from '@/lib/types/api';
import type {
  RecipeCategory,
  RecipeDetail,
  RecipeRecommendationItem,
  RecipeListQuery,
  RecommendedRecipesQuery,
  RecipeSearchQuery,
  RecipeStaticIdsQuery,
  RecipeSummary,
} from '@/lib/types/recipe';

/** 레시피 목록/검색 응답 shape (`Paginated<RecipeSummary>`) */
export type RecipeListResult = Paginated<RecipeSummary>;

/**
 * 레시피 목록 조회 (필터·페이지네이션).
 */
export function getRecipeList(
  params: RecipeListQuery = {},
  fetchOptions?: RequestOptions,
): Promise<RecipeListResult> {
  return httpClient.get<RecipeListResult>(API_ENDPOINTS.recipes.list, {
    ...fetchOptions,
    query: objectToQuery(params),
  });
}

/**
 * 개인화 추천 레시피 조회.
 * 인증 사용자 기준으로 rank 오름차순 추천 목록을 반환한다.
 */
export function getRecommendedRecipes(
  params: RecommendedRecipesQuery = {},
  fetchOptions?: RequestOptions,
): Promise<{ data: RecipeRecommendationItem[] }> {
  return httpClient.get<{ data: RecipeRecommendationItem[] }>(
    API_ENDPOINTS.recipes.recommended,
    {
      ...fetchOptions,
      query: objectToQuery(params),
    },
  );
}

/**
 * 정적 경로 생성용 레시피 ID 목록 조회.
 */
export function getRecipeStaticIds(
  params: RecipeStaticIdsQuery = {},
  fetchOptions?: RequestOptions,
): Promise<{ data: number[] }> {
  return httpClient.get<{ data: number[] }>(API_ENDPOINTS.recipes.staticIds, {
    ...fetchOptions,
    query: objectToQuery(params),
  });
}

/**
 * 레시피 카테고리 목록 조회.
 */
export function getRecipeCategories(
  fetchOptions?: RequestOptions,
): Promise<{ data: RecipeCategory[] }> {
  return httpClient.get<{ data: RecipeCategory[] }>(
    API_ENDPOINTS.recipes.categories,
    fetchOptions,
  );
}

/**
 * 레시피 검색 (키워드·필터·페이지네이션).
 */
export function searchRecipes(
  params: RecipeSearchQuery = {},
  fetchOptions?: RequestOptions,
): Promise<RecipeListResult> {
  return httpClient.get<RecipeListResult>(API_ENDPOINTS.recipes.search, {
    ...fetchOptions,
    query: objectToQuery(params),
  });
}

/**
 * 레시피 단건 상세 조회.
 * 존재하지 않는 ID는 백엔드에서 404를 반환하며 `ApiError`로 throw된다.
 */
export function getRecipeById(
  recipeId: number,
  fetchOptions?: RequestOptions,
): Promise<RecipeDetail> {
  return httpClient.get<RecipeDetail>(
    API_ENDPOINTS.recipes.detail(recipeId),
    fetchOptions,
  );
}

/**
 * 레시피 요약 정보 벌크 조회 (최대 100개).
 * 존재하지 않거나 비공개인 ID는 응답에서 제외된다.
 */
export function getRecipeSummaries(
  ids: number[],
  fetchOptions?: RequestOptions,
): Promise<RecipeSummary[]> {
  return httpClient.post<RecipeSummary[]>(
    API_ENDPOINTS.recipes.summaries,
    { ids },
    fetchOptions,
  );
}
