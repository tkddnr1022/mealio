/**
 * UserIngredient 이벤트 타입 정의
 * Kafka USER_EVENTS 토픽에서 사용되는 이벤트 페이로드 (Producer는 발행만, Consumer에서 MongoDB 저장)
 */

export enum UserIngredientEventType {
  BULK_UPDATE = 'user.ingredient.bulk_update',
  ADD = 'user.ingredient.add',
  REMOVE = 'user.ingredient.remove',
  FAVORITES_UPDATE = 'user.ingredient.favorites_update',
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

export type UserIngredientEvent =
  | UserIngredientBulkUpdateEvent
  | UserIngredientAddEvent
  | UserIngredientRemoveEvent
  | UserIngredientFavoritesUpdateEvent;
