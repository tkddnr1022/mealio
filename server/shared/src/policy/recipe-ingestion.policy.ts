/**
 * Recipe ingestion 파이프라인 **운영·튜닝** 정책 (SSOT).
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §3
 */

import type { RecipeIngestionParseConfidence } from '../constants/recipe-ingestion';

/** 단계별 재시도 상한 (retry_count >= MAX 시 status: failed) · 공공 API fetch HTTP 재시도 상한 */
export const MAX_RECIPE_INGESTION_RETRY_COUNT = 3;

/** fetch HTTP 재시도 백오프 기준(ms) */
export const RECIPE_INGESTION_RETRY_BASE_DELAY_MS = 1_000;

/** fetch 1회 요청 기본·상한 (공공 API ERROR-336) */
export const DEFAULT_RECIPE_FETCH_LIMIT = 100;
export const MAX_RECIPE_FETCH_LIMIT = 1000;

/** failed job 재제출 1회 상한 */
export const DEFAULT_RECIPE_RETRY_FAILED_LIMIT = 100;

/** submit/retrieve/persist CLI — 1회 처리 runId 개수 기본·상한 */
export const DEFAULT_RECIPE_INGESTION_RUN_ID_COUNT = 1;
export const MAX_RECIPE_INGESTION_RUN_ID_COUNT = 3;

/** recipe ingestion submit: 카테고리 컨텍스트 Redis TTL (초) */
export const RECIPE_INGESTION_CATEGORY_CACHE_TTL_SECONDS = 3600;

/** persist 시 기본 난이도·조리시간(분) */
export const RECIPE_INGESTION_DEFAULT_DIFFICULTY = 2;
export const RECIPE_INGESTION_DEFAULT_COOK_TIME_MINUTES = 30;

/** retrieved_data difficulty 허용 범위 (Mealio 1-3, clamp) */
export const RECIPE_INGESTION_DIFFICULTY_MIN = 1;
export const RECIPE_INGESTION_DIFFICULTY_MAX = 3;

/** retrieved_data cookTime 허용 범위 (분, clamp) */
export const RECIPE_INGESTION_COOK_TIME_MIN = 5;
export const RECIPE_INGESTION_COOK_TIME_MAX = 180;

/** OpenAI Batch submit 파라미터 */
export const RECIPE_INGESTION_OPENAI_BATCH_MAX_TOKENS = 8_192;
export const RECIPE_INGESTION_OPENAI_BATCH_REASONING_EFFORT = 'low' as const;
export const RECIPE_INGESTION_OPENAI_BATCH_VERBOSITY = 'low' as const;

/** 재료 벡터 매칭 cosine similarity 임계값 (이상 → match, 미만 → new) */
export const INGREDIENT_VECTOR_MATCH_THRESHOLD = 0.90;

/** persist 허용 최소 parseConfidence (미만이면 검증 거부) */
export const RECIPE_INGESTION_MIN_PARSE_CONFIDENCE: RecipeIngestionParseConfidence =
  'low';

/** Recipe.isPublished=true에 필요한 최소 parseConfidence */
export const RECIPE_INGESTION_MIN_PUBLISH_PARSE_CONFIDENCE: RecipeIngestionParseConfidence =
  'high';
