/**
 * 재료 도메인 타입.
 *
 * 백엔드 DTO 매핑:
 * - `IngredientDto`         → {@link Ingredient}
 * - `IngredientCategoryDto` → {@link IngredientCategory}
 */

/** 재료 마스터 데이터 1건 */
export interface Ingredient {
  id: number;
  name: string;
  categoryId: number;
}

/** 재료 카테고리 */
export interface IngredientCategory {
  id: number;
  key: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
}

/** `GET /ingredients` 쿼리 파라미터 */
export interface IngredientListQuery {
  categoryId?: number;
  page?: number;
  /** 기본 50, 최대 100 */
  size?: number;
}

/** `GET /ingredients/search` 쿼리 파라미터 */
export interface IngredientSearchQuery extends IngredientListQuery {
  q?: string;
}
