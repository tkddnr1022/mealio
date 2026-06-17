# E2E 시나리오/화면 흐름

## 이 문서로 해결할 질문

- 사용자가 앱에 진입해 레시피·챗봇·보관함을 이용하는 흐름은 무엇인가요?
- OAuth 로그인은 어디서 시작하고 어디로 복귀하나요?
- 보호 라우트(로그인 필수)는 어디인가요?

## 앱 구조 (하단 탭)

| 탭 | 대표 URL | 렌더링 |
| --- | --- | --- |
| 레시피 | `/recipe` | ISR + CSR(개인화 추천) |
| 챗봇 | `/chatbot/list` | CSR (보호 라우트) |
| 보관함 | `/inventory/ingredients/owned` | CSR (보호 라우트) |
| 마이페이지 | `/mypage` | CSR |

루트 `/`는 `/recipe`로 리다이렉트합니다.

## 화면 전환 맵

```mermaid
flowchart TB
    RECIPE --> DETAIL["/recipe/id"]
    RECIPE --> SEARCH["/recipe/search"]
    RECIPE --> CHAT["/chatbot/list"]
    RECIPE --> INV["/inventory"]
    RECIPE --> MY["/mypage"]
    CHAT --> CONV["/chatbot/id"]
    LOGIN["/login"] --> RECIPE
    LOGIN -.실패.-> ERR["/oauth/error"]
    ERR -.-> LOGIN
```

## 시나리오 1: OAuth 로그인

```mermaid
sequenceDiagram
    participant U as 사용자
    participant C as client
    participant P as producer
    U->>C: /login 접속
    C->>P: GET /api/v1/auth/{provider}?next=
    P->>U: Provider 인증
    P->>C: 302 /oauth/callback?next= (Set-Cookie)
    C->>C: AuthContext.refresh()
    C->>P: GET /api/v1/users/me
    C->>U: next 경로로 replace (기본 /recipe)
```

- 실패 시 Producer가 `/oauth/error`로 302 리다이렉트합니다.
- `next` 경로 안전 검증은 **백엔드**가 담당합니다(`resolveSafeNextPath`).
- 상세: [인증](../client/auth), [인증/인가](../producer/auth)

## 시나리오 2: 레시피 탐색 → 상세

1. `/recipe`에서는 공개 섹션(ISR)과 로그인 시 개인화 추천 섹션(CSR)을 제공합니다.
2. `/recipe/search`에서는 검색어 기반 SSR 결과를 표시합니다.
3. `/recipe/[id]`는 온디맨드 ISR 상세이며, 조회 시 `recipe.view` 이벤트를 발행합니다.
4. 관심 추가 시 `recipe.favorites_add`가 발행되어 추천 점수가 갱신됩니다.

→ [추천 시스템](./recommendation)

## 시나리오 3: 보관함 재료 관리

1. `/inventory/ingredients/owned`에서 보유 재료 CRUD를 수행합니다.
2. `/ingredient/filter?type=owned`에서 재료 추가 UI를 제공합니다.
3. 변경 시 Producer API가 Kafka `user-events`를 발행하고, Consumer가 Inventory·추천·캐시 무효화를 처리합니다.

Proxy는 `/chatbot`, `/inventory`, `/mypage/*`(루트 `/mypage` 제외)에서 `refreshToken` 쿠키 존재 여부를 검사합니다.

## 시나리오 4: 챗봇 대화

1. `/chatbot/list`에서 대화 목록을 표시합니다.
2. `/chatbot/[id]`에서 메시지를 전송하고 Producer SSE를 구독합니다.
3. Producer가 Kafka `chatbot-requests`를 발행하면 Consumer가 GPT를 처리하고, Redis 스트림을 거쳐 SSE로 전달합니다.
4. 턴 완료 시 크레딧이 멱등하게 차감됩니다.

→ [챗봇 UI/스트리밍](../client/chatbot-ui), [챗봇/SSE](../producer/chatbot-sse), [챗봇 처리](../consumer/chatbot)

## 렌더링 전략 요약

| 전략 | 페이지 예 |
| --- | --- |
| ISR | `/recipe`, `/recipe/filter`, `/ingredient/filter` |
| 온디맨드 ISR | `/recipe/[id]` |
| SSR | `/recipe/search` |
| CSR | 챗봇, 보관함, 마이페이지, 인증 |

## 관련 문서

- [도메인](./domain)
- [추천 시스템](./recommendation)
- [클라이언트 아키텍처](../client/architecture)
- [인증](../client/auth)
- [캐시](../client/cache)
