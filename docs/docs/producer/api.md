---
title: API 문서
---

# API 문서

## 이 문서로 해결할 질문

- OpenAPI 명세는 어디에 있고 어떻게 확인하는가?
- 공통 에러 응답·Rate Limiting 규칙은?
- Swagger 로컬 접근 방법은?

## OpenAPI SSOT

| 파일 | 범위 |
| --- | --- |
| `agent/common/openapi_spec_backend.yaml` | Producer REST API |
| `agent/common/openapi_spec_frontend.yaml` | Next.js Route Handler (BFF) |

코드와 명세 불일치 시 **명세 또는 구현을 동기화**합니다 (`spec_driven_development_guidelines.md`).

## Swagger UI (로컬)

Producer 기동 후 Swagger 엔드포인트 접근 (환경에 따라 `/api/docs` 등 — `swagger.config.ts` 참고).

Apidog 등 외부 도구로 `openapi_spec_backend.yaml` import 가능.

## API 버전·경로

- Base path: `/api/v1`
- 인증: HttpOnly JWT 쿠키 (`accessToken`) 또는 refresh 흐름

## 공통 응답

| 상태 | 의미 |
| --- | --- |
| 200/204 | 성공 |
| 400 | DTO 검증 실패 |
| 401 | 인증 실패·토큰 만료 |
| 403 | 권한 없음 |
| 404 | 리소스 없음 |
| 429 | Rate Limit 초과 |
| 500 | 서버 오류 |

에러 바디: OpenAPI `ErrorResponse` 스키마 (`message`, `statusCode` 등).

## Rate Limiting

- Redis 기반: `rate_limit:api:{identifier}:{windowId}`
- 정책: `server/producer/src/policy/rate-limit.policy.ts`
- 미들웨어: `rate-limit.middleware.ts`

## 엔드포인트 인덱스 (요약)

| 영역 | 대표 경로 |
| --- | --- |
| Auth | `/auth/{provider}`, `/auth/refresh`, `/auth/logout` |
| Users | `/users/me`, `/users/me/nickname`, `/users/me/activities` |
| Recipes | `/recipes`, `/recipes/recommended`, `/recipes/{id}`, `/recipes/search` |
| Ingredients | `/ingredients/search`, `/ingredients/categories` |
| Inventory | `/users/me/inventory`, `.../ingredients/owned`, `.../recipes/favorites` |
| Chatbot | `/chatbot/messages`, `/chatbot/stream/{id}`, `/chatbot/conversations` |
| Health | `/health`, `/ready` |

상세·DTO: [도메인 API 가이드](./domain-api)

## 관련 문서

- [인증/인가](./auth)
- [데이터/계약 인덱스](../project/contracts-index)

## SSOT

- `agent/common/openapi_spec_backend.yaml`
- `agent/backend/spec/backend_architecture_spec_producer.md`
