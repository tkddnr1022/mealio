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

/** 재료 검색 공통 쿼리 파라미터 (페이지·카테고리 필터) */
export interface IngredientSearchQuery {
  q?: string;
  categoryId?: number;
  page?: number;
  /** 기본 50, 최대 100 */
  size?: number;
}
