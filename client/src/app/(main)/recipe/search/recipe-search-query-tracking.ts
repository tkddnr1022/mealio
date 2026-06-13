/** 백엔드 `RecipeQueryService.SEARCH_QUERY_NO_KEYWORD`와 동일한 sentinel */
export const SEARCH_QUERY_NO_KEYWORD = '__no_keyword__';

export const SEARCH_QUERY_SENT_SESSION_KEY_PREFIX = 'recipe:search:query:sent:';

export function getSearchQueryKeywordSegment(keyword: string): string {
  const trimmed = keyword.trim();
  return trimmed.length > 0 ? trimmed : SEARCH_QUERY_NO_KEYWORD;
}

export function getSearchQuerySessionKey(keyword: string): string {
  return `${SEARCH_QUERY_SENT_SESSION_KEY_PREFIX}${getSearchQueryKeywordSegment(keyword)}`;
}

export function hasSentSearchQuery(
  storage: Pick<Storage, 'getItem'>,
  keyword: string,
): boolean {
  return storage.getItem(getSearchQuerySessionKey(keyword)) === '1';
}

export function markSearchQuerySent(
  storage: Pick<Storage, 'setItem'>,
  keyword: string,
): void {
  storage.setItem(getSearchQuerySessionKey(keyword), '1');
}
