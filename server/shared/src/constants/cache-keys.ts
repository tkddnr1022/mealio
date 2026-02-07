/**
 * Redis 캐시 키 prefix (Producer 캐시 전략·Consumer 캐시 무효화에서 공통 사용)
 */
export const CACHE_KEY_PREFIX = {
  USER: 'user',
  USER_INGREDIENT: 'user-ingredient',
} as const;
