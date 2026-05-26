# 프론트엔드 관측 이벤트 계측 체크리스트

SaaS-only(GA4 + Sentry + Vercel Analytics) 기준.

이벤트 사전·KPI SSOT: [event_dictionary.md](./event_dictionary.md).

## 이벤트·호출 위치

| 이벤트 | 상수 | 호출 위치 | 비고 |
|--------|------|-----------|------|
| `recipe_viewed` | `AnalyticsEvents.RECIPE_VIEWED` | `RecipeDetailClientPage` | 세션당 1회(조회수 API와 동일 가드) |
| `recipe_saved` | `AnalyticsEvents.RECIPE_SAVED` | `RecipeFavoriteButton` | mutation 성공 후 |
| `recipe_unsaved` | `AnalyticsEvents.RECIPE_UNSAVED` | `RecipeFavoriteButton` | mutation 성공 후 |
| `chatbot_message_sent` | `AnalyticsEvents.CHATBOT_MESSAGE_SENT` | `ChatbotConversationClientPage` | 전송 직전 |
| `page_view` | (analytics 내부) | `ObservabilityBootstrap` | pathname·query 변경마다 |

## 백엔드와 역할 분리

> GA ↔ EventLog/Kafka 이벤트 매핑·SSOT·중복 금지 규칙 상세는 [event_dictionary.md](./event_dictionary.md) §1~2를 참조한다.

## 사용자 컨텍스트

- `AnalyticsAuthSync`: 로그인 시 `setAnalyticsContext({ userId })`, 로그아웃·비인증 시 `userId` 제거.
- 서버 EventLog는 API·Kafka 경로의 `actor.userId`를 SSOT로 사용한다.

## 추가 계측 후보 (미구현)

- `recipe_search_submitted` — 검색 제출
- `oauth_login_started` — 로그인 버튼 클릭
- `ingredient_filter_applied` — 재료 필터 적용

상수는 `client/src/lib/observability/analytics-events.ts`에 추가한다.
