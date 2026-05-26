# 이벤트 사전 (프론트 GA ↔ 백엔드 EventLog/Kafka)

이벤트 이름·역할·KPI 매핑의 단일 참조. **신규 이벤트는 본 사전 갱신 후** 코드에 반영한다(리뷰 게이트).

## 1. 네이밍 규칙

| 계층 | 형식 | 예 |
|------|------|-----|
| GA4 (프론트) | `snake_case` | `recipe_viewed`, `chatbot_message_sent` |
| EventLog / Kafka | `domain.action` (점 표기) | `recipe.view`, `recipe.favorites_add` |
| Kafka 토픽 | `kebab-case` | `activity-events`, `user-events` |

- **동일 의미 이중 정의 금지**: UI 노출·퍼널은 GA, 도메인 확정·추천·감사는 EventLog.
- 프론트 `recipe_viewed` ≠ 서버 `recipe.view` (이름만 다름, 의미는 유사하나 SSOT 분리).

## 2. 매핑 표 (구현 완료)

| GA4 이벤트 | EventLog `type` | Kafka 토픽 | 발행 주체 | KPI |
|------------|-----------------|------------|-----------|-----|
| `page_view` | — | — | Client (`ObservabilityBootstrap`) | GA 탐색만 |
| `recipe_viewed` | `recipe.view` | `activity-events` | Producer `POST .../recipes/:id/views` | `kpi_ga_recipe_funnel`, `kpi_recipe_favorite_cvr` (분모) |
| `recipe_saved` | `recipe.favorites_add` | `user-events` | Producer (관심 추가 API) | `kpi_ga_recipe_funnel`, `kpi_recipe_favorite_cvr` (분자) |
| `recipe_unsaved` | `recipe.favorites_remove` | `user-events` | Producer (관심 삭제 API) | 이탈 분석 |
| `chatbot_message_sent` | `chatbot.message` | `chatbot-requests` | Consumer processor | `kpi_chatbot_dau_messages`, GA 참여 |

### 2.1 코드 앵커

| GA4 | 파일 |
|-----|------|
| `recipe_viewed` | `client/src/app/(main)/recipe/[id]/RecipeDetailClientPage.tsx` |
| `recipe_saved` / `recipe_unsaved` | `client/src/components/recipe/cards/RecipeFavoriteButton/RecipeFavoriteButton.tsx` |
| `chatbot_message_sent` | `client/src/app/(main)/chatbot/[id]/ChatbotConversationClientPage.tsx` |
| 상수 | `client/src/lib/observability/analytics-events.ts` |

| EventLog | 파일 |
|----------|------|
| activity 타입 | `server/consumer/.../activity-events.processor.ts` |
| user 타입 | `server/consumer/.../TrackUserActivityHandler.ts` |
| chatbot | `server/consumer/.../chatbot-request.processor.ts` |

## 3. 서버 전용 EventLog (GA 미전송)

| EventLog `type` | Kafka 토픽 | 발행/기록 | KPI·용도 |
|-----------------|------------|-----------|----------|
| `recipe.like` | `activity-events` | Producer | 추천 보정 (+0.7) |
| `recipe.share` | `activity-events` | Producer | 추천 보정 (+0.4) |
| `search.query` | `activity-events` | Producer 검색 API | `kpi_search_click_rate` (분모) |
| `search.click` | `activity-events` | Producer | `kpi_search_click_rate` (분자) |
| `signup`, `login`, `nickname.update` | `user-events` | Producer OAuth/프로필 | 가입·활성 (추천 delta 0) |
| `ingredient.*`, `recipe.favorites_*` | `user-events` | Producer | 추천·인벤토리, `kpi_recommendation_e2e_latency` |
| `chatbot.start` | `chatbot-requests` | Consumer | 챗봇 퍼널 시작 |

KPI별 SSOT는 [product_kpi_contract.md](./product_kpi_contract.md) §1을, 추가 계측 후보는 [frontend_event_instrumentation.md](./frontend_event_instrumentation.md)를 참조한다.

## 4. 승인 절차

1. 본 문서에 행 추가(이름·토픽·SSOT·KPI).
2. `analytics-events.ts` 또는 shared event enum 갱신.
3. `frontend_event_instrumentation.md` 체크리스트 반영.
4. PR 리뷰 시 "사전 미등록 이벤트" 차단.

## 5. 관련 문서

- [product_kpi_contract.md](./product_kpi_contract.md)
- [aggregation_pipeline.md](./aggregation_pipeline.md)
