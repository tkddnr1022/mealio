export const SEARCH_CLICK_SENT_SESSION_KEY_PREFIX = 'recipe:search:click:sent:';

export function getSearchClickSessionKey(recipeId: number): string {
  return `${SEARCH_CLICK_SENT_SESSION_KEY_PREFIX}${recipeId}`;
}

export function hasSentSearchClick(
  storage: Pick<Storage, 'getItem'>,
  recipeId: number,
): boolean {
  return storage.getItem(getSearchClickSessionKey(recipeId)) === '1';
}

export function markSearchClickSent(
  storage: Pick<Storage, 'setItem'>,
  recipeId: number,
): void {
  storage.setItem(getSearchClickSessionKey(recipeId), '1');
}
