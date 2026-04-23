/**
 * Inventory 이벤트 타입 정의
 */
export enum InventoryEventType {
  UPDATE = 'ingredient.update',
  ADD = 'ingredient.add',
  REMOVE = 'ingredient.remove',
  FAVORITES_UPDATE = 'ingredient.favorites_update',
  FAVORITES_ADD = 'ingredient.favorites_add',
  FAVORITES_REMOVE = 'ingredient.favorites_remove',
}

export const INVENTORY_EVENT_TYPES: InventoryEventType[] = [
  ...Object.values(InventoryEventType),
];

export interface InventoryUpdateEvent {
  type: InventoryEventType.UPDATE;
  userId: number;
  ownedIngredientIds: number[];
  timestamp: string;
}

export interface InventoryAddEvent {
  type: InventoryEventType.ADD;
  userId: number;
  ownedIngredientIds: number[];
  timestamp: string;
}

export interface InventoryRemoveEvent {
  type: InventoryEventType.REMOVE;
  userId: number;
  ingredientId: number;
  timestamp: string;
}

export interface InventoryFavoritesUpdateEvent {
  type: InventoryEventType.FAVORITES_UPDATE;
  userId: number;
  favoriteIngredientIds: number[];
  timestamp: string;
}

export interface InventoryFavoritesAddEvent {
  type: InventoryEventType.FAVORITES_ADD;
  userId: number;
  favoriteIngredientIds: number[];
  timestamp: string;
}

export interface InventoryFavoritesRemoveEvent {
  type: InventoryEventType.FAVORITES_REMOVE;
  userId: number;
  ingredientId: number;
  timestamp: string;
}

export type InventoryEvent =
  | InventoryUpdateEvent
  | InventoryAddEvent
  | InventoryRemoveEvent
  | InventoryFavoritesUpdateEvent
  | InventoryFavoritesAddEvent
  | InventoryFavoritesRemoveEvent;

export function isInventoryEvent(
  obj: unknown,
): obj is InventoryEvent {
  const o = obj as Record<string, unknown>;
  return (
    'type' in o &&
    typeof o.type === 'string' &&
    INVENTORY_EVENT_TYPES.includes(o.type as InventoryEventType)
  );
}
