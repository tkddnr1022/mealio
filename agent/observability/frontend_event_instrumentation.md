# 프론트엔드 관측 이벤트 계측 체크리스트

SaaS-only(GA4 + Sentry + Vercel Analytics) 기준.

이벤트 사전·KPI SSOT: [event_dictionary.md](./event_dictionary.md).

## GA4 스크립트 로딩

`@next/third-parties/google`의 `GoogleAnalytics` 컴포넌트가 루트 레이아웃(`layout.tsx`)에서 gtag.js를 로딩한다. `NEXT_PUBLIC_GA_MEASUREMENT_ID` 환경 변수가 설정된 경우에만 렌더링된다.

커스텀 이벤트 전송은 `sendGAEvent`(@next/third-parties) 기반의 GA4 dispatcher가 담당하며, 기존 `trackEvent` 래퍼 API는 유지된다.

## 이벤트·호출 위치

| 이벤트 | 상수 | 호출 위치 | 비고 |
|--------|------|-----------|------|
| `recipe_viewed` | `AnalyticsEvents.RECIPE_VIEWED` | `RecipeDetailClientPage` | 세션당 1회(조회수 API와 동일 가드) |
| `recipe_saved` | `AnalyticsEvents.RECIPE_SAVED` | `RecipeFavoriteButton` | mutation 성공 후 |
| `recipe_unsaved` | `AnalyticsEvents.RECIPE_UNSAVED` | `RecipeFavoriteButton` | mutation 성공 후 |
| `chatbot_message_sent` | `AnalyticsEvents.CHATBOT_MESSAGE_SENT` | `ChatbotConversationClientPage` | 전송 직전 |
| `scroll` | (GA4 표준) | `CustomScrollbar` | 사용자 스크롤로 90% 도달 시 페이지당 1회 |
| `page_view` | (자동) | `GoogleAnalytics` 컴포넌트 | 초기 로드: `gtag('config')`, SPA 전환: Enhanced Measurement |

## scroll 정책

앱 본문은 `CustomScrollbar` 내부 컨테이너에서 스크롤되므로 document 기준 Enhanced Measurement Scroll은 오탐한다. `CustomScrollbar`의 scroll 핸들러에서 `sendGAEvent('event', 'scroll', { percent_scrolled: 90 })`를 전송한다. GA 콘솔 Enhanced Measurement의 **Scrolls는 비활성화**한다.

## page_view 정책

`page_view`는 `GoogleAnalytics` 컴포넌트(@next/third-parties)와 GA Enhanced Measurement("Page changes based on browser history events")에 의해 자동 수집된다. 수동 `trackPageView` 호출은 사용하지 않는다. GA 콘솔에서 Enhanced Measurement가 **활성화**되어 있는지 확인해야 SPA 라우트 전환이 추적된다.

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
