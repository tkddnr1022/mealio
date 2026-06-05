/**
 * Recipe ingestion 파이프라인 **운영·튜닝** 정책 (SSOT).
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §3
 */

/** 단계별 재시도 상한 (retry_count >= MAX 시 status: failed) · 공공 API fetch HTTP 재시도 상한 */
export const MAX_RECIPE_INGESTION_RETRY_COUNT = 3;

/** fetch HTTP 재시도 백오프 기준(ms) */
export const RECIPE_INGESTION_RETRY_BASE_DELAY_MS = 1_000;

/** fetch 1회 요청 기본·상한 (공공 API ERROR-336) */
export const DEFAULT_RECIPE_FETCH_LIMIT = 100;
export const MAX_RECIPE_FETCH_LIMIT = 1000;

/** submit 1회 제출 기본 건수 (status: fetched 대상) */
export const DEFAULT_RECIPE_SUBMIT_BATCH_SIZE = 100;

/** submit 1회 제출 상한 (OpenAI Batch input 라인 수) */
export const MAX_RECIPE_SUBMIT_BATCH_SIZE = 1000;

/** persist 1회 처리 기본 건수 — submit 배치와 동일 정책 */
export const DEFAULT_RECIPE_PERSIST_BATCH_SIZE =
  DEFAULT_RECIPE_SUBMIT_BATCH_SIZE;

/** failed job 재제출 1회 상한 — submit 배치와 동일 정책 */
export const DEFAULT_RECIPE_RETRY_FAILED_LIMIT =
  DEFAULT_RECIPE_SUBMIT_BATCH_SIZE;

/** recipe ingestion submit: 카테고리 컨텍스트 Redis TTL (초) */
export const RECIPE_INGESTION_CATEGORY_CACHE_TTL_SECONDS = 3600;

/** persist 시 기본 난이도·조리시간(분) */
export const RECIPE_INGESTION_DEFAULT_DIFFICULTY = 2;
export const RECIPE_INGESTION_DEFAULT_COOK_TIME_MINUTES = 30;

/** OpenAI Batch submit 파라미터 */
export const RECIPE_INGESTION_OPENAI_BATCH_MAX_TOKENS = 8_192;
export const RECIPE_INGESTION_OPENAI_BATCH_REASONING_EFFORT = 'low' as const;
export const RECIPE_INGESTION_OPENAI_BATCH_VERBOSITY = 'low' as const;
