export const VIEW_SENT_SESSION_KEY_PREFIX = 'recipe:view:sent:';

export function getRecipeViewSessionKey(recipeId: number): string {
  return `${VIEW_SENT_SESSION_KEY_PREFIX}${recipeId}`;
}

export function hasSentRecipeView(
  storage: Pick<Storage, 'getItem'>,
  recipeId: number,
): boolean {
  return storage.getItem(getRecipeViewSessionKey(recipeId)) === '1';
}

export function markRecipeViewSent(
  storage: Pick<Storage, 'setItem'>,
  recipeId: number,
): void {
  storage.setItem(getRecipeViewSessionKey(recipeId), '1');
}
