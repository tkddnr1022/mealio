/**
 * 개인화 추천 정책 (SSOT).
 * - Consumer: UserRecipeRecommendation Top N 재정렬 상한
 * - Producer: GET /recipes/recommended `limit` 쿼리 상한
 */
export const MAX_RECOMMENDATION_ROWS = 10;
