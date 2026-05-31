/**
 * Recipe ingestion 파이프라인 공통 상수 (SSOT)
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §3
 */

export const RECIPE_INGESTION_JOB_STATUSES = [
  'fetched',
  'submitting',
  'submitted',
  'retrieving',
  'retrieved',
  'persisting',
  'persisted',
  'failed',
] as const;

export type RecipeIngestionJobStatus =
  (typeof RECIPE_INGESTION_JOB_STATUSES)[number];

/** 단계별 재시도 상한 (retry_count >= MAX 시 status: failed) */
export const MAX_RECIPE_INGESTION_RETRY_COUNT = 3;

/** recipe_ingestion_state singleton 문서 키 */
export const RECIPE_INGESTION_STATE_KEY = 'singleton';

/** fetch 1회 요청 기본·상한 (공공 API ERROR-336) */
export const DEFAULT_RECIPE_FETCH_LIMIT = 100;
export const MAX_RECIPE_FETCH_LIMIT = 1000;

/** submit 1회 제출 기본 건수 (status: fetched 대상) */
export const DEFAULT_RECIPE_SUBMIT_BATCH_SIZE = 100;

/** submit 1회 제출 상한 (OpenAI Batch input 라인 수) */
export const MAX_RECIPE_SUBMIT_BATCH_SIZE = 1000;

/** recipe ingestion submit: 카테고리 컨텍스트 Redis TTL (초) */
export const RECIPE_INGESTION_CATEGORY_CACHE_TTL_SECONDS = 3600;

/** PostgreSQL Recipe.source — 공공데이터(COOKRCP01) 출처 식별자 */
export const RECIPE_INGESTION_RECIPE_SOURCE = 'foodsafety';

/** 카테고리 매핑 실패 시 기본 레시피 카테고리 id (seed: KOREAN) */
export const RECIPE_INGESTION_DEFAULT_RECIPE_CATEGORY_ID = 1;

/** 재료 카테고리 매핑 실패 시 기본 재료 카테고리 id (seed: VEGETABLE) */
export const RECIPE_INGESTION_DEFAULT_INGREDIENT_CATEGORY_ID = 1;

/** persist 시 기본 난이도·조리시간(분) */
export const RECIPE_INGESTION_DEFAULT_DIFFICULTY = 2;
export const RECIPE_INGESTION_DEFAULT_COOK_TIME_MINUTES = 30;
