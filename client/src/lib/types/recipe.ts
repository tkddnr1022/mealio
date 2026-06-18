/**
 * 레시피 도메인 타입.
 *
 * 백엔드 DTO 매핑:
 * - `RecipeSummary`  → 목록·검색 응답 item
 * - `RecipeDetail`   → `GET /recipes/:recipeId` 응답
 * - `RecipeCategory` → `GET /recipes/categories` 응답 item
 */

/** 정렬 키. 백엔드 기본값은 `latest`. */
export const RECIPE_SORT_KEYS = [
  'latest',
  'cookTime',
  'difficulty',
  'viewCount',
  'likeCount',
] as const;

/** 정렬 키. 백엔드 기본값은 `latest`. */
export type RecipeSortKey = (typeof RECIPE_SORT_KEYS)[number];

/** 목록·검색에서 반환되는 레시피 기본 정보 */
export interface RecipeSummary {
  id: number;
  title: string;
  description: string | null;
  difficulty: number;
  cookTime: number;
  imageUrl: string | null;
  servings: number;
  viewCount: number;
  /** 좋아요 수(목록·검색 응답) */
  likeCount: number;
  isPublished: boolean;
  /** ISO 8601 */
  createdAt: string;
}

/**
 * 레시피 공통 기본 타입 alias.
 * 목록·검색 응답 item 타입으로 넓게 재사용되며,
 * 상세 응답은 {@link RecipeDetail}이 이를 확장한다.
 */
export type Recipe = RecipeSummary;

/** 레시피 재료 1건 */
export interface RecipeIngredientItem {
  id: number;
  name: string;
  amount: number | null;
  unit: string | null;
  isOptional: boolean;
}

/** 레시피 조리 단계 1건 */
export interface RecipeInstructionStep {
  step: number;
  content: string;
  imageUrl?: string | null;
}

/** 1인분 기준 영양 정보 */
export interface RecipeNutrition {
  calories: number | null;
  carbohydrates: number | null;
  protein: number | null;
  fat: number | null;
  sodium: number | null;
}

/** 레시피 상세 응답 */
export interface RecipeDetail extends RecipeSummary {
  categoryId: number;
  categoryName: string;
  /** 조리 방법 (예: 찌기, 볶기) */
  cookingMethod: string | null;
  /** 요리 종류 (예: 반찬, 국) */
  dishType: string | null;
  nutrition: RecipeNutrition | null;
  /** 저감·건강 조리 팁 */
  cookingTip: string | null;
  /** 데이터 출처 식별자 */
  source: string | null;
  /** 출처별 레시피 ID */
  sourceRecipeId: string | null;
  instructions: RecipeInstructionStep[];
  ingredients: RecipeIngredientItem[];
}

/** 레시피 카테고리 */
export interface RecipeCategory {
  id: number;
  key: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

/** `GET /recipes/recommended` 쿼리 파라미터 */
export interface RecommendedRecipesQuery {
  limit?: number;
}

/** `GET /recipes/recommended` 응답 item */
export interface RecipeRecommendationItem {
  recipe: RecipeSummary;
  rank: number;
  score: number;
  reason: string | null;
  /** ISO 8601 */
  calculatedAt: string;
}

/** `GET /recipes` 쿼리 파라미터 */
export interface RecipeListQuery {
  page?: number;
  size?: number;
  difficulty?: number[];
  cookTimeMin?: number;
  cookTimeMax?: number;
  sort?: RecipeSortKey;
}

/** `GET /recipes/search` 쿼리 파라미터 */
export interface RecipeSearchQuery extends RecipeListQuery {
  /** 제목·설명·조리방법·요리종류 키워드 검색 */
  q?: string;
  categoryId?: number;
}

/** `GET /recipes/static-ids` 쿼리 파라미터 (응답 ID는 인기순 정렬) */
export interface RecipeStaticIdsQuery {
  size?: number;
}
