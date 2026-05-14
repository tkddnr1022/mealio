import type { ToastItem } from './toast.types';

export type ToastReducerAction =
  | { type: 'upsert'; item: ToastItem; dedupeKey?: string }
  | { type: 'dismiss'; id: string }
  | { type: 'clear' };

/** 동시에 쌓일 수 있는 토스트 상한 */
export const MAX_VISIBLE_TOASTS = 5;

export function toastReducer(
  state: readonly ToastItem[],
  action: ToastReducerAction,
): ToastItem[] {
  switch (action.type) {
    case 'upsert': {
      const { item, dedupeKey } = action;
      if (!dedupeKey) {
        const next = [...state, item];
        return next.length > MAX_VISIBLE_TOASTS
          ? next.slice(next.length - MAX_VISIBLE_TOASTS)
          : next;
      }
      const idx = state.findIndex((t) => t.dedupeKey === dedupeKey);
      if (idx === -1) {
        const next = [...state, item];
        return next.length > MAX_VISIBLE_TOASTS
          ? next.slice(next.length - MAX_VISIBLE_TOASTS)
          : next;
      }
      const copy = [...state];
      copy[idx] = item;
      return copy;
    }
    case 'dismiss':
      return state.filter((t) => t.id !== action.id);
    case 'clear':
      return [];
    default:
      return [...state];
  }
}
