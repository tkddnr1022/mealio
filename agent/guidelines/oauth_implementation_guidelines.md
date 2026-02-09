# OAuth 구현 전략 (백엔드 주도)

에이전트가 OAuth 인증을 구현할 때 따를 **백엔드 주도** 절차와 API·설정 규칙을 정의한다. 클라이언트는 로그인 진입 API만 호출하며, 이후 인증·토큰 교환·JWT 발급은 모두 백엔드와 Provider 리다이렉트로 처리한다.

---

## 1. 인증 흐름 개요

1. **진입**: 클라이언트가 `GET /api/v1/auth/{provider}` 호출
2. **리다이렉트**: 서버가 302로 Provider 인증 URL로 보냄 (Client ID, Scope, Redirect URI는 서버에서 관리)
3. **Redirect URI**: **백엔드 API**를 가리킴. Provider가 인증 후 해당 백엔드 URL로 Authorization Code와 함께 리다이렉트
4. **콜백**: 백엔드가 Code → OAuth Token 교환 → 사용자 정보 요청 → 사용자 생성/조회 → 자체 JWT 발급 → 클라이언트 로그인 성공 URL로 302 리다이렉트 + 쿠키에 JWT 설정

클라이언트는 1번만 호출하면 되며, 2~4는 브라우저 리다이렉트와 백엔드에서만 처리한다.

---

## 2. API 계약

### 2.1 OAuth 진입 (로그인 시작)

| 항목 | 내용 |
|------|------|
| **Method / Path** | `GET /api/v1/auth/{provider}` |
| **Path parameter** | `provider`: Provider 식별자 (예: `google`, `kakao`, `naver`) |
| **동작** | 서버가 보유한 Client ID, Scope, Redirect URI로 Provider 인증 URL 생성 후 **302 Redirect** 응답 |
| **Redirect URI** | 반드시 **백엔드 콜백 URL** (예: `https://api.example.com/api/v1/auth/{provider}/callback`) |

- 환경 설정(Client ID, Secret, Scope, Redirect URI)은 **백엔드에만** 두고, 클라이언트에는 노출하지 않는다.

### 2.2 OAuth 콜백 (Provider → 백엔드)

| 항목 | 내용 |
|------|------|
| **Method / Path** | `GET /api/v1/auth/{provider}/callback` |
| **Query** | Provider가 전달하는 `code` (필수), `state`(보안용 권장) 등 |
| **동작** | 1) Authorization Code로 OAuth Token 요청 2) OAuth Token으로 사용자 정보 요청 3) 사용자 생성/조회 4) 자체 JWT 발급 5) **302 Redirect** to 클라이언트 로그인 성공 URL + **Set-Cookie**로 JWT 전달 (HttpOnly, Secure, SameSite=Lax) |

- 로그인 성공 후 리다이렉트할 클라이언트 URL(예: `/`, `/dashboard`)은 환경 변수 또는 고정값으로 백엔드에서 관리한다.

---

## 3. 보안 고려사항

- 리다이렉트 기반 OAuth에서는 CSRF(`state` 파라미터), Authorization Code 탈취 방지 등이 권장된다. 상세는 [OAuth 2.1](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-10) 및 각 Provider 문서를 따른다.
- Client Secret은 서버에만 두고, Redirect URI는 백엔드 콜백 URL로 고정해 클라이언트에 노출하지 않는다.
