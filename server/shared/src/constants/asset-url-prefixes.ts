/**
 * 정적 에셋 URL prefix 상수
 * - Base URL은 환경별 설정에서 주입하고, 여기서는 경로 prefix만 제공
 */
export const ASSET_URL_PREFIX = {
  RECIPE_IMAGE: '/recipes/images',
  INGREDIENT_CATEGORY_ICON: '/ingredients/category-icons',
} as const;
