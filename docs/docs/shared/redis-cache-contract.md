# Redis 키/캐시 계약

## 이 문서로 해결할 질문

- Producer·Consumer가 공유하는 Redis 키 규칙은 무엇인가요?
- prefix·헬퍼 함수는 어디에 정의되나요?
- 무효화 시 삭제되는 패턴은 무엇인가요?

Producer `CacheService`, Consumer Handler, 무효화 핸들러는 `server/shared/.../cache-keys.ts`를 **동일 파일**에서 import합니다.

키 형식은 `{prefix}:{segment...}`이며, 세그먼트는 `:`로 구분합니다.

## Prefix 목록

| `CACHE_KEY_PREFIX` | 용도 |
| --- | --- |
| `user` | 유저 프로필 |
| `inventory` | 내 재료함 |
| `recipe` | 레시피 상세·목록·챗봇 카테고리 |
| `recommendation` | 개인화 추천 |
| `ingredient` | 재료 목록·by-id |
| `rate_limit:api` | API 레이트 리밋 (데이터 캐시와 분리) |
| `dedupe` | activity 이벤트 중복 방지 |

## 주요 헬퍼

| 함수 | 키 예 |
| --- | --- |
| `cacheKeyUserProfile(userId)` | `user:42` |
| `cacheKeyInventory(userId)` | `inventory:42` |
| `cacheKeyRecipeDetail(recipeId)` | `recipe:123` |
| `cacheKeyRecommendation(userId)` | `recommendation:42` |
| `cacheKeyIngredientById(id)` | `ingredient:by-id:7` |
| `cacheKeyChatbotFoodCategories()` | `recipe:chatbot:food-categories` |
| `cacheKeyRecipeIngestionFoodCategories()` | `recipe:ingestion:food-categories` |
| `cacheKeyDedupeRecipeView(...)` | `dedupe:recipe:view:{id}:{actor}` |

## 무효화 패턴

`cachePatternRecipeInvalidation()`과 `cachePatternIngredientInvalidation()`은 `{ patterns, singleKeys }` 객체를 반환합니다.

| 함수 | `patterns` | `singleKeys` |
| --- | --- | --- |
| `cachePatternRecipeInvalidation()` | `recipe:list:*`, `recipe:search:*`, `recipe:list:static-ids:*` | `recipe:categories` |
| `cachePatternIngredientInvalidation()` | `ingredient:list:*`, `ingredient:search:*` | `ingredient:categories` |

Consumer `RedisInvalidationHandler`가 `CacheInvalidationEventType`에 따라 위 패턴을 적용합니다.

### `CacheInvalidationEventType`별 삭제 대상

| type | 삭제 대상 |
| --- | --- |
| `USER_PROFILE` | `user:{userId}` |
| `INVENTORY` | `inventory:{userId}` |
| `RECIPE` | `recipe:{recipeId}` + `cachePatternRecipeInvalidation()` |
| `RECOMMENDATION` | `recommendation:{userId}` |
| `INGREDIENT` | `cachePatternIngredientInvalidation()` |

## 추천 캐시·무효화 계약

| 항목 | 값 |
| --- | --- |
| 키 | `recommendation:{userId}` |
| Producer TTL | 3600초 |
| 무효화 타입 | `RECOMMENDATION` |
| 발행 | `CacheInvalidationRequestService.requestRecommendationInvalidation(userId)` |

추천 캐시 흐름은 [추천 시스템](../project/recommendation) 문서를 참고하세요.

## 변경 시 체크리스트

1. 새 prefix나 segment가 필요하면 `cache-keys.ts`에 추가합니다.
2. Producer 전략과 Consumer Handler에서 헬퍼를 사용하고, raw 문자열은 쓰지 않습니다.
3. 무효화가 필요하면 `cachePattern*()` 또는 `CacheInvalidationEventType`을 확장합니다.
4. [Shared 개요](./overview)와 Producer·Consumer 캐시 문서를 동기화합니다.

## 관련 문서

- [개요](./overview)
- [공유 계약](./contracts)
- [캐시 (producer)](../producer/cache)
- [캐시 무효화](../consumer/cache-invalidation)
