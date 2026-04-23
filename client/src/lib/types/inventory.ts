/**
 * 인벤토리 도메인 타입.
 *
 * 백엔드 `InventoryController` 응답과 1:1 대응한다.
 * 보유(owned)·관심(favorites) 두 리스트가 동일한 레코드 타입을 공유한다.
 */

/**
 * 인벤토리에 담긴 재료 1건.
 * 마스터 재료({@link import('./ingredient').Ingredient})와 달리 `categoryId`가 null일 수 있다
 * (사용자가 직접 입력한 커스텀 재료).
 */
export interface InventoryIngredient {
  id: number;
  name: string;
  categoryId: number | null;
}

/** `GET /users/me/inventory/ingredients` 응답 */
export interface InventoryResponse {
  /** 보유 재료 목록 */
  ownedIngredients: InventoryIngredient[];
  /** 즐겨찾기(관심) 재료 목록 */
  favoriteIngredients: InventoryIngredient[];
}
