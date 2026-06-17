# API 문서

## 이 문서로 해결할 질문

- API 계약은 어디에 있고 어떻게 확인하나요?
- 공통 에러 응답·Rate Limiting 규칙은 무엇인가요?
- Swagger 로컬 접근 방법은 무엇인가요?

## API 계약 참고

| 참조 | 범위 |
| --- | --- |
| 내부 OpenAPI 명세 | Producer REST API 전체 DTO·응답 스키마 |
| `server/producer/.../modules/` | 컨트롤러·서비스 구현 |
| [BFF Route Handler](../client/api-bff) · `client/src/.../api/` | Next.js Route Handler (BFF) |

코드와 문서 불일치 시 **문서 또는 구현을 동기화**합니다. [기여 가이드](../other/contributing)를 참고하세요.

## Swagger UI (로컬)

Producer를 기동한 뒤 `http://localhost:3000/api-docs`에 접근합니다 (`server/producer/.../swagger.config.ts`).

Apidog 등 외부 도구로 Swagger 스펙을 export한 뒤 import할 수 있습니다.

## API 버전·경로

- Base path는 `/api/v1`입니다.
- 인증은 HttpOnly JWT 쿠키(`accessToken`) 또는 refresh 흐름을 사용합니다.

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

에러 바디는 OpenAPI `ErrorResponse` 스키마(`message`, `statusCode` 등)를 따릅니다.

## Rate Limiting

- Redis 기반으로 `rate_limit:api:{identifier}:{windowId}` 키를 사용합니다.
- 정책은 `server/producer/.../rate-limit.policy.ts`에 정의되어 있습니다(60초 윈도우, 최대 100요청).
- 미들웨어는 `server/producer/.../rate-limit.middleware.ts`입니다.

## 엔드포인트 인덱스 (요약)

| 영역 | 대표 경로 |
| --- | --- |
| Auth | `/auth/{provider}`, `/auth/refresh`, `/auth/logout` |
| Users | `/users/me`, `/users/me/nickname`, `/users/me/activities` |
| Recipes | `/recipes`, `/recipes/recommended`, `/recipes/{id}`, `/recipes/search` |
| Ingredients | `/ingredients/search`, `/ingredients/categories` |
| Inventory | `/users/me/inventory`, `.../ingredients/owned`, `.../recipes/favorites` |
| Chatbot | `/chatbot/messages` (SSE), `/chatbot/conversations` |
| Health | `/health`, `/ready` |

상세 API와 DTO는 [도메인 API 가이드](./domain-api)를 참고하세요.

## 관련 문서

- [인증/인가](./auth)
- [도메인 API 가이드](./domain-api)
- [환경 변수](./environment-variables)
