/**
 * 챗봇 search_recipes 시맨틱 검색·Query Expansion 정책.
 */
export const RECIPE_SEARCH_ANN_TOP_K_PER_QUERY = 50;
export const RECIPE_SEARCH_QUERY_EXPANSION_MAX = 3;
export const RECIPE_SEARCH_QUERY_EXPANSION_COVERAGE_BONUS = 0.05;

/** search_recipes 후보 풀 크기. 최종 추천 개수는 LLM이 이 목록에서 선택한다. */
export const RECIPE_SEARCH_RESULT_LIMIT = 10;

/** 재료명 → Ingredient ID 벡터 해상 시 ANN top-K (임계값은 INGREDIENT_VECTOR_MATCH_THRESHOLD). */
export const RECIPE_SEARCH_INGREDIENT_RESOLVE_TOP_K = 1;

export const RECIPE_SEARCH_RERANK_WEIGHT = {
  semantic: 0.5,
  keyword: 0.15,
  inventoryMatch: 0.15,
  userPreference: 0.1,
  softConstraint: 0.1,
} as const;

/** reasonSignals 태그 부여 임계값. */
export const RECIPE_SEARCH_REASON_SIGNAL_THRESHOLDS = {
  semantic: 0.6,
  keyword: 0.5,
  inventoryMatch: 0.4,
  userPreference: 0.4,
  softConstraint: 0.5,
} as const;
