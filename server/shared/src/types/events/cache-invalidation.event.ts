/**
 * cache-invalidation 토픽 페이로드 타입.
 * Consumer의 CacheInvalidationRequestService가 발행하고,
 * CacheInvalidationProcessor가 구독해 Redis 등 캐시를 무효화할 때 사용한다.
 */
export enum CacheInvalidationEventType {
  USER_PROFILE = 'user-profile',
  USER_INGREDIENT = 'user-ingredient',
}

export interface CacheInvalidationUserProfilePayload {
  type: CacheInvalidationEventType.USER_PROFILE;
  userId: number;
}

export interface CacheInvalidationUserIngredientPayload {
  type: CacheInvalidationEventType.USER_INGREDIENT;
  userId: number;
}

export type CacheInvalidationPayload =
  | CacheInvalidationUserProfilePayload
  | CacheInvalidationUserIngredientPayload;
