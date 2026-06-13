/** 백엔드 `RecipeQueryService.SEARCH_QUERY_NO_KEYWORD`와 동일한 sentinel */
export const SEARCH_QUERY_NO_KEYWORD = '__no_keyword__' as const;

export const RECIPE_SESSION_TRACKING_KEY_PREFIX = {
  searchClick: 'recipe:search:click:sent:',
  searchQuery: 'recipe:search:query:sent:',
  view: 'recipe:view:sent:',
} as const;
