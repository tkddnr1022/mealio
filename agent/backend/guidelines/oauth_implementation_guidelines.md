# OAuth 구현 전략 (백엔드 주도)

에이전트가 OAuth 인증·세션(access/refresh 쿠키)을 구현할 때 따를 **백엔드 주도** 절차와 API·설정 규칙을 정의한다. 클라이언트는 로그인 진입 API만 호출하며, 이후 인증·토큰 교환·자체 토큰 발급은 모두 백엔드와 Provider 리다이렉트로 처리한다. 갱신·로그아웃도 동일하게 백엔드 API·쿠키 계약을 따른다.

---

## 1. 인증 흐름 개요

1. **진입**: 클라이언트가 `GET /api/v1/auth/{provider}` 호출
2. **리다이렉트**: 서버가 302로 Provider 인증 URL로 보냄 (Client ID, Scope, Redirect URI는 서버에서 관리)
3. **Redirect URI**: **백엔드 API**를 가리킴. Provider가 인증 후 해당 백엔드 URL로 Authorization Code와 함께 리다이렉트
4. **콜백**: 백엔드가 Code → OAuth Token 교환 → 사용자 정보 요청 → 사용자 생성/조회 → 자체 JWT 발급 → 성공 시 프론트 최종 경로로 302 + `accessToken`/`refreshToken` 쿠키 설정, 실패 시 `FRONTEND_OAUTH_ERROR_PATH`로 302

클라이언트는 1번만 호출하면 되며, 2~4는 브라우저 리다이렉트와 백엔드에서만 처리한다.

---

## 2. API 계약

### 2.1 OAuth 진입 (로그인 시작)

| 항목 | 내용 |
|------|------|
| **Method / Path** | `GET /api/v1/auth/{provider}` |
| **Path parameter** | `provider`: Provider 식별자 (예: `google`, `kakao`, `naver`) |
| **Query (optional)** | `next`: 로그인 완료 후 이동할 프론트 상대 경로 (`/` 시작, `//` 금지) |
| **동작** | 서버가 보유한 Client ID, Scope, Redirect URI로 Provider 인증 URL 생성 후 **302 Redirect** 응답 |
| **Redirect URI** | 반드시 **백엔드 콜백 URL** (예: `https://api.example.com/api/v1/auth/{provider}/callback`) |

- 환경 설정(Client ID, Secret, Scope, Redirect URI)은 **백엔드에만** 두고, 클라이언트에는 노출하지 않는다.

### 2.2 OAuth 콜백 (Provider → 백엔드)

| 항목 | 내용 |
|------|------|
| **Method / Path** | `GET /api/v1/auth/{provider}/callback` |
| **Query** | 성공 시 `code`(필수), `state`(선택). 실패 시 `error`, `error_description` 가능 |
| **동작(성공)** | 1) Authorization Code로 OAuth Token 요청 2) OAuth Token으로 사용자 정보 요청 3) 사용자 생성/조회 4) 자체 JWT 발급 5) **302 Redirect** to `FRONTEND_APP_BASE_URL` + `FRONTEND_OAUTH_SUCCESS_CALLBACK_PATH`(검증된 `next`가 있으면 `?next=` 포함) + **Set-Cookie**로 `accessToken`/`refreshToken` 전달 (HttpOnly, Secure, SameSite=Lax, Path=/) |
| **동작(실패)** | OAuth 실패를 `FRONTEND_APP_BASE_URL` + `FRONTEND_OAUTH_ERROR_PATH`로 **302 Redirect**하고 쿼리로 `errorCode`, `errorMessage`, optional `next`(안전한 경로만)를 전달 |

- 프론트로 돌아갈 URL은 **베이스 + 경로**로 나눈다.
  - `FRONTEND_APP_BASE_URL`: 프론트 앱 오리진(예: `https://app.example.com`). CORS 허용 오리진 계산에도 사용한다.
  - `FRONTEND_OAUTH_ERROR_PATH`: 실패 시 붙일 경로(예: `/oauth/error`, 반드시 `/`로 시작).
  - `FRONTEND_OAUTH_SUCCESS_CALLBACK_PATH`: 성공 시 붙일 프론트 콜백 경로(예: `/oauth/callback`). 클라이언트가 AuthStatus 마킹 후 `next`(없으면 프론트 기본 경로)로 이동한다.
- `next` 검증(상대 경로만, `//` 금지 등)은 **백엔드**에서만 수행한다. 클라이언트는 진입 시 `next`를 그대로 넘길 수 있으며, 서버의 `buildOAuthState`·`resolveSafeNextPath`가 근거다.

### 2.3 토큰 갱신 (Refresh)

| 항목 | 내용 |
|------|------|
| **Method / Path** | `POST /api/v1/auth/refresh` |
| **인증** | HttpOnly `refreshToken` 쿠키(opaque token, 예: `sessionId.secret`) |
| **동작(성공)** | DB(`auth_refresh_sessions`)에서 세션 검증(SSOT) → 기존 세션 revoke → 신규 세션 생성 → **access/refresh 동시 회전 발급** → `Set-Cookie`로 `accessToken`/`refreshToken` 재설정 (HttpOnly, Secure, SameSite=Lax, Path=/) |
| **동작(실패)** | `401 Unauthorized`. 이미 revoke·교체된 refresh 재사용이 감지되면 해당 사용자의 활성 refresh 세션을 일괄 revoke한다. |
| **캐시** | Redis(`auth:refresh:session:{sessionId}`)는 조회 가속용이며, 최종 판정·폐기는 PostgreSQL이 담당한다. |

- 상세 구현·환경 변수(`REFRESH_TOKEN_TTL_SEC` 등)는 `../spec/backend_architecture_spec_producer.md` §1.3 **Refresh Token** 표를 본다.

### 2.4 로그아웃

| 항목 | 내용 |
|------|------|
| **Method / Path** | `POST /api/v1/auth/logout` |
| **인증** | HttpOnly `accessToken` 쿠키(JWT) |
| **동작(성공)** | `204 No Content` + `Set-Cookie`로 `accessToken`/`refreshToken` 삭제(Max-Age=0) + 해당 사용자 refresh 세션 revoke |

---

## 3. 보안 고려사항

- 리다이렉트 기반 OAuth에서는 CSRF(`state` 파라미터), Authorization Code 탈취 방지 등이 권장된다. 상세는 [OAuth 2.1](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-10) 및 각 Provider 문서를 따른다.
- Client Secret은 서버에만 두고, Redirect URI는 백엔드 콜백 URL로 고정해 클라이언트에 노출하지 않는다.
