/**
 * UserIngredient 이벤트 타입 정의
 */
export enum UserIngredientEventType {
  UPDATE = 'ingredient.update',
  ADD = 'ingredient.add',
  REMOVE = 'ingredient.remove',
  FAVORITES_UPDATE = 'ingredient.favorites_update',
  FAVORITES_ADD = 'ingredient.favorites_add',
  FAVORITES_REMOVE = 'ingredient.favorites_remove',
}

export const USER_INGREDIENT_EVENT_TYPES: UserIngredientEventType[] = [
  ...Object.values(UserIngredientEventType),
];

export interface UserIngredientUpdateEvent {
  type: UserIngredientEventType.UPDATE;
  userId: number;
  ingredientIds: number[];
  timestamp: string;
}

export interface UserIngredientAddEvent {
  type: UserIngredientEventType.ADD;
  userId: number;
  ingredientIds: number[];
  timestamp: string;
}

export interface UserIngredientRemoveEvent {
  type: UserIngredientEventType.REMOVE;
  userId: number;
  ingredientId: number;
  timestamp: string;
}

export interface UserIngredientFavoritesUpdateEvent {
  type: UserIngredientEventType.FAVORITES_UPDATE;
  userId: number;
  ingredientIds: number[];
  timestamp: string;
}

export interface UserIngredientFavoritesAddEvent {
  type: UserIngredientEventType.FAVORITES_ADD;
  userId: number;
  ingredientIds: number[];
  timestamp: string;
}

export interface UserIngredientFavoritesRemoveEvent {
  type: UserIngredientEventType.FAVORITES_REMOVE;
  userId: number;
  ingredientId: number;
  timestamp: string;
}

export type UserIngredientEvent =
  | UserIngredientUpdateEvent
  | UserIngredientAddEvent
  | UserIngredientRemoveEvent
  | UserIngredientFavoritesUpdateEvent
  | UserIngredientFavoritesAddEvent
  | UserIngredientFavoritesRemoveEvent;

export function isUserIngredientEvent(
  obj: unknown,
): obj is UserIngredientEvent {
  const o = obj as Record<string, unknown>;
  return (
    'type' in o &&
    typeof o.type === 'string' &&
    USER_INGREDIENT_EVENT_TYPES.includes(o.type as UserIngredientEventType)
  );
}
