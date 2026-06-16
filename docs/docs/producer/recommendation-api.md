---
title: 추천 API
---

# 추천 API

## 이 문서로 해결할 질문

- `GET /recipes/recommended` 계약과 응답 필드는 무엇인가요?
- 캐시·fallback·무효화는 어떻게 동작하나요?
- Consumer 추천 파이프라인과의 관계는 무엇인가요?

전체 흐름: [추천 시스템](../project/recommendation)

## 엔드포인트

```http
GET /api/v1/recipes/recommended?limit=10
Authorization: Cookie accessToken (JWT 필수)
```

| 항목 | 값 |
| --- | --- |
| Guard | `JwtAuthGuard` |
| Query `limit` | 기본 10, 최소 1, 최대 10 |
| Controller | `recipes.controller.ts` |
| Service | `RecipeQueryService.getRecommended()` |

## 응답 (`RecommendedRecipeItemDto[]`)

| 필드 | 설명 |
| --- | --- |
| `recipe` | `RecipeSummary` (제목, 이미지, stats 등) |
| `rank` | 추천 순위 (1부터) |
| `score` | 추천 점수 |
| `reason` | 추천 근거 문구 |
| `calculatedAt` | 원본 갱신 시각 |

OpenAPI: `RecipeRecommendationItem`

## 조회 로직

```text
1. Redis recommendation:{userId} 조회 (TTL 3600s)
2. miss → PostgreSQL UserRecipeRecommendation 원본 테이블 조회
3. RecipeSummary + RecipeStats 조인
4. 원본 행 없음 → likeCount DESC 인기 레시피 fallback
5. Redis에 저장 후 반환
```

Fallback 시 `reason`에 초기 추천 데이터 없음을 명시합니다.

## 캐시

| 항목 | 값 |
| --- | --- |
| 전략 | `recommendation-cache-strategy.ts` |
| 키 | `recommendation:{userId}` |
| TTL | 3600초 (`CACHE_TTL_RECOMMENDATION_SECONDS`) |

무효화: Consumer `RECOMMENDATION` → [캐시 무효화](../consumer/cache-invalidation)

## 프론트엔드 연동

- `/recipe` CSR 섹션: `useRecommendedRecipes()` — React Query `QUERY_CACHE.recommended`
- 로그인 필수 — 비로그인 시 섹션 미표시 또는 로그인 유도

## 원본 갱신 (Consumer)

`user-events`·`activity-events` → `RecommendationHandler` → PostgreSQL upsert + Top N 재정렬 → 캐시 무효화.

가중치: [Consumer 아키텍처](../consumer/architecture) · server/consumer/src/ §2.6.2

## 확장 시 유의

챗봇 `SuggestedRecipe`와 추천 원본 테이블를 **직접 동기화하지 않습니다**. 필요 시 챗봇 tool이 본 API를 호출하는 방식으로 확장합니다.

## 관련 문서

- [추천 파이프라인](../consumer/recommendation-pipeline)
- [Redis 키/캐시 계약](../shared/redis-cache-contract)
- [캐시 (client)](../client/cache)

## 참고 코드·계약

- [Producer 아키텍처](../producer/architecture) · server/producer/src/ (§1.4)
- [Producer API](../producer/api) · server/producer/src/modules/ (`/api/v1/recipes/recommended`)
