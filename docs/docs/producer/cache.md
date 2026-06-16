---
title: 캐시
---

# 캐시

## 이 문서로 해결할 질문

- Producer Redis Cache-Aside 패턴은?
- 도메인별 TTL·캐시 키는?
- 캐시 miss·무효화 후 동작은?

## Cache-Aside 패턴

```text
1. API 요청 → CacheService.getOrSet(key, fetcher, ttl)
2. Redis hit → 즉시 반환
3. Redis miss → DB 조회 → Redis 저장 → 반환
4. Consumer 무효화 → Redis 키 삭제 → 다음 요청 시 DB 폴백
```

구현: `server/producer/src/infrastructure/cache/`

## TTL 정의

`server/producer/src/policy/cache.policy.ts` (초 단위)

| 상수 | TTL | 도메인 |
| --- | --- | --- |
| `CACHE_TTL_RECIPE_LIST_SECONDS` | 300 (5분) | 레시피 목록·검색 |
| `CACHE_TTL_RECIPE_DETAIL_SECONDS` | 900 (15분) | 레시피 상세 |
| `CACHE_TTL_RECOMMENDATION_SECONDS` | 3600 (1시간) | 개인화 추천 |
| `CACHE_TTL_INGREDIENT_SECONDS` | 86400 (24시간) | 재료 목록·검색 |
| `CACHE_TTL_INVENTORY_SECONDS` | 300 (5분) | 내 재료함 |
| `CACHE_TTL_USER_PROFILE_SECONDS` | 300 (5분) | 유저 프로필 |

각 도메인은 `*-cache-strategy.ts`에서 위 상수를 import합니다.

## 전략 클래스

| 파일 | 키 패턴 | 비고 |
| --- | --- | --- |
| `user-cache-strategy.ts` | `user:{userId}` | |
| `inventory-cache-strategy.ts` | `inventory:{userId}` | |
| `recommendation-cache-strategy.ts` | `recommendation:{userId}` | §1.4 추천 API |
| recipe/ingredient 전략 | `recipe:*`, `ingredient:*` | list/search/categories |

키 헬퍼 정의: `@mealio/shared` `cache-keys.ts` → [Redis 키/캐시 계약](../shared/redis-cache-contract)

## 무효화 (Consumer 연동)

Producer는 캐시를 **직접 삭제하지 않습니다**. Consumer가 `cache-invalidation` 토픽을 발행하면 `RedisInvalidationHandler`가 키를 삭제합니다.

| 무효화 타입 | 삭제 대상 |
| --- | --- |
| `USER_PROFILE` | `user:{userId}` |
| `INVENTORY` | `inventory:{userId}` |
| `RECIPE` | `recipe:{id}`, `recipe:list:*`, `recipe:search:*` |
| `RECOMMENDATION` | `recommendation:{userId}` |

→ [캐시 무효화](../consumer/cache-invalidation)

## Rate Limiting (별도 네임스페이스)

`rate_limit:api:{identifier}:{windowId}` — Redis 기반 API 요청 제한. 애플리케이션 데이터 캐시와 분리됩니다.

구현: `modules/middleware/rate-limit.middleware.ts`

## 변경 시 체크리스트

1. TTL 변경 → `cache.policy.ts` + 해당 `*-cache-strategy.ts`
2. 새 캐시 키 → `server/shared/src/constants/cache-keys.ts` + 무효화 패턴
3. 무효화 트리거 추가 → Consumer `CacheInvalidationRequestService`

## 관련 문서

- [캐시 (client)](../client/cache)
- [Redis 키/캐시 계약](../shared/redis-cache-contract)
- [추천 API](./recommendation-api)

## 참고 코드·계약

- `server/producer/src/policy/cache.policy.ts`
- [Producer 아키텍처](../producer/architecture) · server/producer/src/ (§1.4)
- [개발 규약](../other/development-conventions)
