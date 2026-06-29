/** OpenAPI `/recipes/search` 기본 page size */
export const RECIPE_SEARCH_PAGE_SIZE = 20;

/** OpenAPI `/ingredients/search` 기본 page size */
export const INGREDIENT_SEARCH_PAGE_SIZE = 50;

/** OpenAPI `GET /chatbot/conversations` 기본 limit */
export const CHATBOT_CONVERSATION_LIST_LIMIT = 20;

/** OpenAPI `GET /users/me/activities` 기본 limit */
export const USER_ACTIVITY_LIST_LIMIT = 20;

/** 커서 페이지네이션: 현재 페이지 조회 결과 개수가 limit과 같으면 다음 페이지가 있다고 판단한다. */
export function hasCursorNextPage(
  pageItemCount: number,
  limit: number,
): boolean {
  return pageItemCount === limit;
}
