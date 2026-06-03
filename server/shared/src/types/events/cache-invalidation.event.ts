/**
 * cache-invalidation 토픽 페이로드 타입.
 * Consumer의 CacheInvalidationRequestService가 발행하고,
 * CacheInvalidationProcessor가 구독해 Redis 등 캐시를 무효화할 때 사용한다.
 */
export enum CacheInvalidationEventType {
  USER_PROFILE = 'user-profile',
  INVENTORY = 'inventory',
  RECIPE = 'recipe',
  RECOMMENDATION = 'recommendation',
  INGREDIENT = 'ingredient',
}

export interface CacheInvalidationUserProfilePayload {
  type: CacheInvalidationEventType.USER_PROFILE;
  userId: number;
}

export interface CacheInvalidationInventoryPayload {
  type: CacheInvalidationEventType.INVENTORY;
  userId: number;
}

export interface CacheInvalidationRecipePayload {
  type: CacheInvalidationEventType.RECIPE;
  recipeIds: number[];
}

export interface CacheInvalidationRecommendationPayload {
  type: CacheInvalidationEventType.RECOMMENDATION;
  userId: number;
}

export interface CacheInvalidationIngredientPayload {
  type: CacheInvalidationEventType.INGREDIENT;
}

export type CacheInvalidationPayload =
  | CacheInvalidationUserProfilePayload
  | CacheInvalidationInventoryPayload
  | CacheInvalidationRecipePayload
  | CacheInvalidationRecommendationPayload
  | CacheInvalidationIngredientPayload;
