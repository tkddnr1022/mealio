/**
 * Recipe ingestion 파이프라인 **계약** 상수 (SSOT).
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §3
 * @see agent/common/config_centralization_audit.md
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

/** recipe_ingestion_state singleton 문서 키 */
export const RECIPE_INGESTION_STATE_KEY = 'singleton';

/** PostgreSQL Recipe.source — 공공데이터 API(식품의약품안전처) 출처 식별자 */
export const RECIPE_INGESTION_RECIPE_SOURCE = 'foodsafety';

/** 카테고리 매핑 실패 시 기본 레시피 카테고리 id (seed: KOREAN) */
export const RECIPE_INGESTION_DEFAULT_RECIPE_CATEGORY_ID = 1;

/** 재료 카테고리 매핑 실패 시 기본 재료 카테고리 id (seed: VEGETABLE) */
export const RECIPE_INGESTION_DEFAULT_INGREDIENT_CATEGORY_ID = 1;

/** LLM retrieved_data parseConfidence 허용 값 (높음 → 낮음) */
export const RECIPE_INGESTION_PARSE_CONFIDENCE_VALUES = [
  'high',
  'medium',
  'low',
] as const;

export type RecipeIngestionParseConfidence =
  (typeof RECIPE_INGESTION_PARSE_CONFIDENCE_VALUES)[number];

const RECIPE_INGESTION_PARSE_CONFIDENCE_RANK: Record<
  RecipeIngestionParseConfidence,
  number
> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function isRecipeIngestionParseConfidence(
  value: unknown,
): value is RecipeIngestionParseConfidence {
  return (
    typeof value === 'string' &&
    (RECIPE_INGESTION_PARSE_CONFIDENCE_VALUES as readonly string[]).includes(
      value,
    )
  );
}

export function meetsRecipeIngestionMinParseConfidence(
  confidence: RecipeIngestionParseConfidence,
  min: RecipeIngestionParseConfidence,
): boolean {
  return (
    RECIPE_INGESTION_PARSE_CONFIDENCE_RANK[confidence] >=
    RECIPE_INGESTION_PARSE_CONFIDENCE_RANK[min]
  );
}
