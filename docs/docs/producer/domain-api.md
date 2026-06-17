# 도메인 API 가이드

## 이 문서로 해결할 질문

- Producer 도메인 모듈별 엔드포인트와 DB 사용은 무엇인가요?
- 인증이 필요한 API는 무엇인가요?
- 쓰기 API의 Kafka 연동은 무엇인가요?

API 계약: [Producer API](../producer/api) · server/producer/src/modules/

## 모듈 요약

| 모듈 | DB | 인증 | Kafka 발행 |
| --- | --- | --- | --- |
| auth | PostgreSQL | — | login/signup 이벤트 |
| users | PostgreSQL + Redis | JWT | nickname → user-events |
| recipes | PostgreSQL + Redis | 혼합 | views, search → activity-events |
| ingredients | PostgreSQL + Redis | 공개 조회 | — |
| inventory | MongoDB + Redis | JWT | CRUD → user-events |
| chatbot | — | JWT | messages → chatbot-requests |

## auth

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/v1/auth/{provider}` | OAuth 진입 |
| GET | `/api/v1/auth/{provider}/callback` | OAuth 콜백 |
| POST | `/api/v1/auth/refresh` | 토큰 갱신 |
| POST | `/api/v1/auth/logout` | 로그아웃 |

→ [인증/인가](./auth)

## users

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/v1/users/me` | 내 프로필 |
| PATCH | `/api/v1/users/me/nickname` | 닉네임 변경 |
| GET | `/api/v1/users/me/activities` | 활동 내역 |

## recipes (조회·검색·이벤트)

| Method | Path | 인증 | 비고 |
| --- | --- | --- | --- |
| GET | `/api/v1/recipes` | 선택 | 목록 |
| GET | `/api/v1/recipes/recommended` | **필수** | 개인화 추천 |
| GET | `/api/v1/recipes/{recipeId}` | 공개 | 상세 |
| GET | `/api/v1/recipes/search` | 공개 | 검색 |
| GET | `/api/v1/recipes/static-ids` | 공개 | ISR static params |
| POST | `/api/v1/recipes/summaries` | 공개 | ID 배치 요약 |
| POST | `/api/v1/recipes/{recipeId}/views` | 선택 | 조회 이벤트 |
| POST | `/api/v1/recipes/search-queries` | 선택 | 검색어 이벤트 |
| POST | `/api/v1/recipes/{recipeId}/search-clicks` | 선택 | 검색 클릭 |

→ [추천 API](./recommendation-api)

## ingredients

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/v1/ingredients/search` | 재료 검색 |
| GET | `/api/v1/ingredients/categories` | 카테고리 |

## inventory

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/api/v1/users/me/inventory` | 보관함 조회 |
| GET | `/api/v1/users/me/favorite-recipes/ids` | 관심 레시피 ID |
| PUT/POST/DELETE | `.../inventory/ingredients/owned` | 보유 재료 |
| PUT/POST/DELETE | `.../inventory/ingredients/favorites` | 관심 재료 |
| POST/DELETE | `.../inventory/recipes/favorites` | 관심 레시피 |

쓰기 성공 → `user-events` → Consumer Inventory·추천·캐시 무효화.

## chatbot

| Method | Path | 설명 |
| --- | --- | --- |
| POST | `/api/v1/chatbot/messages` | 메시지 전송 |
| GET | `/api/v1/chatbot/stream/{streamChannelId}` | SSE 구독 |
| GET | `/api/v1/chatbot/conversations` | 대화 목록 |
| GET | `/api/v1/chatbot/conversations/{id}` | 대화 상세 |

→ [챗봇/SSE](./chatbot-sse)

## 공통 규칙

- **읽기**: Cache-Aside (Redis) → DB 폴백
- **쓰기**: HTTP 200 = Kafka 발행 성공 (DB 최종 반영은 Consumer)
- **Rate Limit**: Redis 기반 — `rate-limit.middleware.ts`
- **에러**: OpenAPI `ErrorResponse` 스키마

## 관련 문서

- [API 문서](./api)
- [이벤트 발행](./event-publishing)
- [캐시](./cache)
