/** 레시피 그리드·슬라이더 공통 레이아웃 (열×행). 예: 2×2, 2×1 */
export interface RecipeGridLayout {
  /** 그리드 열 수 */
  columns: number;
  /** 슬라이더 한 페이지당 행 수. `RecipeGrid` 단독 사용 시 시각적 행 제한에는 쓰이지 않음 */
  rows: number;
}

export const DEFAULT_RECIPE_GRID_LAYOUT: RecipeGridLayout = {
  columns: 2,
  rows: 2,
};

const GRID_COLS_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
};

export function getRecipeGridColsClass(columns: number): string {
  return GRID_COLS_CLASS[columns] ?? 'grid-cols-2';
}

export function getCardsPerPage(layout: RecipeGridLayout): number {
  return layout.columns * layout.rows;
}
