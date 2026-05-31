/**
 * Recipe ingestion 파이프라인 공통 상수 (SSOT)
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §3
 */

export const RECIPE_INGESTION_JOB_STATUSES = [
  'ingested',
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
