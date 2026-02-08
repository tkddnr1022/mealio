/**
 * UserIngredient 이벤트 타입 정의
 */
export enum UserIngredientEventType {
  BULK_UPDATE = 'user.ingredient.bulk_update',
  ADD = 'user.ingredient.add',
  REMOVE = 'user.ingredient.remove',
  FAVORITES_UPDATE = 'user.ingredient.favorites_update',
  FAVORITES_ADD = 'user.ingredient.favorites_add',
  FAVORITES_REMOVE = 'user.ingredient.favorites_remove',
}

export interface UserIngredientBulkUpdateEvent {
  type: UserIngredientEventType.BULK_UPDATE;
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
  | UserIngredientBulkUpdateEvent
  | UserIngredientAddEvent
  | UserIngredientRemoveEvent
  | UserIngredientFavoritesUpdateEvent
  | UserIngredientFavoritesAddEvent
  | UserIngredientFavoritesRemoveEvent;
