/**
 * Redis 캐시 키 — Producer(CacheService·전략)·Consumer(직접 Redis)·무효화 핸들러에서 동일 규칙 사용
 *
 * 키 형식: `{prefix}:{segment...}` (세그먼트는 `:` 로 연결)
 */

/** 최상위 네임스페이스 (prefix) — 애플리케이션 캐시·Consumer 무효화·인프라 Redis 키 공통 정의 */
export const CACHE_KEY_PREFIX = {
  USER: 'user',
  INVENTORY: 'inventory',
  RECIPE: 'recipe',
  RECOMMENDATION: 'recommendation',
  INGREDIENT: 'ingredient',
  /** Producer API 레이트 리밋 카운터 (애플리케이션 데이터 캐시와 별도 네임스페이스) */
  RATE_LIMIT_API: 'rate_limit:api',
} as const;

export type CacheKeyPrefix =
  (typeof CACHE_KEY_PREFIX)[keyof typeof CACHE_KEY_PREFIX];

/**
 * `getOrSet` 등에서 두 번째 이후 세그먼트로 쓰는 고정 문자열
 * (Producer 서비스·전략과 동일한 키가 나오도록 여기서만 정의)
 */
// TODO: 캐시 재사용 전략 수립
export const CACHE_KEY_SEGMENT = {
  LIST: 'list',
  SEARCH: 'search',
  CATEGORIES: 'categories',
  /** 미지정 목록 조회 시 목록 키에 사용 */
  ALL: 'all',
  /**
   * Consumer 챗봇: 재료 단건 메타데이터 Redis 캐시
   * `ingredient:by-id:{id}` 형태의 두 번째 세그먼트
   */
  BY_ID: 'by-id',
  /**
   * Consumer 챗봇: get_food_categories 응답 (레시피·재료 활성 카테고리 JSON)
   * `recipe:chatbot:food-categories`
   */
  CHATBOT_FOOD_CATEGORIES: 'chatbot:food-categories',
  /**
   * Consumer recipe ingestion submit: LLM system prompt용 카테고리 컨텍스트
   * `recipe:ingestion:food-categories`
   */
  RECIPE_INGESTION_FOOD_CATEGORIES: 'ingestion:food-categories',
} as const;

/** `prefix` + 세그먼트들을 `:` 로 결합 (Producer CacheStrategy·무효화·Consumer 공통) */
export function buildCacheKey(
  prefix: CacheKeyPrefix,
  ...segments: (string | number)[]
): string {
  if (segments.length === 0) {
    return prefix;
  }
  return `${prefix}:${segments.map(String).join(':')}`;
}

/** Producer 유저 프로필 캐시 — `user:{userId}` */
export function cacheKeyUserProfile(userId: number): string {
  return buildCacheKey(CACHE_KEY_PREFIX.USER, userId);
}

/** Producer 내 재료함 캐시 — `inventory:{userId}` */
export function cacheKeyInventory(userId: number): string {
  return buildCacheKey(CACHE_KEY_PREFIX.INVENTORY, userId);
}

/**
 * Consumer 챗봇: 재료 단건 메타데이터 Redis 캐시
 * `ingredient:by-id:{ingredientId}` (Producer 목록·검색 키 `ingredient:list:...` 등과 구분)
 */
export function cacheKeyIngredientById(ingredientId: number): string {
  return buildCacheKey(
    CACHE_KEY_PREFIX.INGREDIENT,
    CACHE_KEY_SEGMENT.BY_ID,
    ingredientId,
  );
}

/** Consumer 챗봇 FoodCategoriesHandler — `recipe:chatbot:food-categories` */
export function cacheKeyChatbotFoodCategories(): string {
  return buildCacheKey(
    CACHE_KEY_PREFIX.RECIPE,
    CACHE_KEY_SEGMENT.CHATBOT_FOOD_CATEGORIES,
  );
}

/** Consumer recipe ingestion submit — `recipe:ingestion:food-categories` */
export function cacheKeyRecipeIngestionFoodCategories(): string {
  return buildCacheKey(
    CACHE_KEY_PREFIX.RECIPE,
    CACHE_KEY_SEGMENT.RECIPE_INGESTION_FOOD_CATEGORIES,
  );
}

/** Producer 레이트 리밋: `rate_limit:api:{identifier}:{windowId}` */
export function cacheKeyRateLimitApi(
  identifier: string,
  windowId: number,
): string {
  return buildCacheKey(CACHE_KEY_PREFIX.RATE_LIMIT_API, identifier, windowId);
}

/** Producer 레시피 상세 캐시 — `recipe:{recipeId}` */
export function cacheKeyRecipeDetail(recipeId: number): string {
  return buildCacheKey(CACHE_KEY_PREFIX.RECIPE, recipeId);
}

/** Producer 개인화 추천 캐시 — `recommendation:{userId}` */
export function cacheKeyRecommendation(userId: number): string {
  return buildCacheKey(CACHE_KEY_PREFIX.RECOMMENDATION, userId);
}

/** Producer 레시피 카테고리 캐시 — `recipe:categories` */
export function cacheKeyRecipeCategories(): string {
  return buildCacheKey(
    CACHE_KEY_PREFIX.RECIPE,
    CACHE_KEY_SEGMENT.CATEGORIES,
  );
}

/** Producer static-ids 목록 캐시 패턴 — `recipe:list:static-ids:*` */
export function cachePatternRecipeStaticIds(): string {
  return buildCacheKey(
    CACHE_KEY_PREFIX.RECIPE,
    CACHE_KEY_SEGMENT.LIST,
    'static-ids',
    '*',
  );
}

/** Producer 레시피 목록/검색 캐시 패턴 — `recipe:list:*`, `recipe:search:*` */
export function cachePatternRecipeListAndSearch(): string[] {
  return [
    buildCacheKey(CACHE_KEY_PREFIX.RECIPE, CACHE_KEY_SEGMENT.LIST, '*'),
    buildCacheKey(CACHE_KEY_PREFIX.RECIPE, CACHE_KEY_SEGMENT.SEARCH, '*'),
  ];
}

/** Producer ingredient 카테고리 캐시 — `ingredient:categories` */
export function cacheKeyIngredientCategories(): string {
  return buildCacheKey(
    CACHE_KEY_PREFIX.INGREDIENT,
    CACHE_KEY_SEGMENT.CATEGORIES,
  );
}

/** Producer ingredient 목록·검색 캐시 패턴 — `ingredient:list:*`, `ingredient:search:*` */
export function cachePatternIngredientListAndSearch(): string[] {
  return [
    buildCacheKey(CACHE_KEY_PREFIX.INGREDIENT, CACHE_KEY_SEGMENT.LIST, '*'),
    buildCacheKey(CACHE_KEY_PREFIX.INGREDIENT, CACHE_KEY_SEGMENT.SEARCH, '*'),
  ];
}

/**
 * INGREDIENT 무효화 시 삭제할 Redis 패턴·단건 키 목록
 */
export function cachePatternIngredientInvalidation(): {
  patterns: string[];
  singleKeys: string[];
} {
  return {
    patterns: cachePatternIngredientListAndSearch(),
    singleKeys: [cacheKeyIngredientCategories()],
  };
}

/**
 * RECIPE 무효화 시 삭제할 Redis 패턴·단건 키 목록
 * (list/search/static-ids 패턴 + categories 단건)
 */
export function cachePatternRecipeInvalidation(): {
  patterns: string[];
  singleKeys: string[];
} {
  return {
    patterns: [
      ...cachePatternRecipeListAndSearch(),
      cachePatternRecipeStaticIds(),
    ],
    singleKeys: [cacheKeyRecipeCategories()],
  };
}
