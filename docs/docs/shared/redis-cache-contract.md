# Redis 키/캐시 계약

## 이 문서로 해결할 질문

- Producer·Consumer가 공유하는 Redis 키 규칙은 무엇인가요?
- prefix·헬퍼 함수는 어디에 정의되나요?
- 무효화 시 삭제되는 패턴은 무엇인가요?

`server/shared/.../cache-keys.ts` — Producer CacheService, Consumer Handler, 무효화 핸들러가 **동일 파일**을 import합니다.

키 형식: `{prefix}:{segment...}` (`:` 구분)

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
| `cacheKeyDedupeRecipeView(...)` | `dedupe:recipe:view:{id}:{actor}` |

## 무효화 패턴

| 함수 | 삭제 범위 |
| --- | --- |
| `cachePatternRecipeInvalidation()` | `recipe:list:*`, `recipe:search:*`, `recipe:list:static-ids:*`, `recipe:categories` |
| `cachePatternIngredientInvalidation()` | `ingredient:list:*`, `ingredient:search:*`, `ingredient:categories` |

Consumer `RedisInvalidationHandler`가 `CacheInvalidationEventType`에 따라 위 패턴을 적용합니다.

## 추천 캐시·무효화 계약

| 항목 | 값 |
| --- | --- |
| 키 | `recommendation:{userId}` |
| Producer TTL | 3600초 |
| 무효화 타입 | `RECOMMENDATION` |
| 발행 | `CacheInvalidationRequestService.requestRecommendationInvalidation(userId)` |

→ [추천 시스템](../project/recommendation)

## 변경 시 체크리스트

1. 새 prefix/segment → `cache-keys.ts`에 추가
2. Producer 전략·Consumer Handler에서 헬퍼 사용 (raw 문자열 금지)
3. 무효화 필요 시 `cachePattern*()` 또는 `CacheInvalidationEventType` 확장
4. [Shared 개요](./overview) 및 Producer·Consumer 캐시 문서 동기화

## 관련 문서

- [캐시 (producer)](../producer/cache)
- [캐시 무효화](../consumer/cache-invalidation)
- [공유 계약](./contracts)
