# 프론트엔드 관측 운영 Runbook

> **제품 KPI**: Kafka·EventLog·Prometheus 알림·장애 대응은 [product_kpi_runbook.md](./product_kpi_runbook.md)를 따른다.

## 사전 조건

| 환경 변수 | staging/prod | 로컬 |
|-----------|--------------|------|
| `NEXT_PUBLIC_SENTRY_DSN` | 설정 | 비워도 됨 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | 설정 | 비워도 됨 |

Vercel 배포 시 Web Vitals는 Vercel Analytics 대시보드에서 확인한다.

## 수동 검증 시나리오

### 1. 페이지뷰 (GA4)

1. staging 앱 접속 → GA4 **실시간** 보고서 열기
2. `/recipe`, `/chatbot/list`, `/recipe/1` 등 이동
3. `page_view` 이벤트·`page_path`가 경로와 일치하는지 확인

### 2. 도메인 이벤트 (GA4)

| 동작 | 기대 이벤트 |
|------|-------------|
| 레시피 상세 진입 | `recipe_viewed` + `recipe_id` |
| 관심 레시피 토글(추가) | `recipe_saved` |
| 관심 레시피 토글(해제) | `recipe_unsaved` |
| 챗봇 메시지 전송 | `chatbot_message_sent` |

### 3. API 에러 (Sentry)

1. 네트워크 오류 또는 5xx API 유도(개발자 도구에서 API 차단 등)
2. Sentry Issues에서 `service:client` 태그 확인
3. `correlationId` 태그가 백엔드 로그 `X-Correlation-Id`와 동일한지 대조

### 3-1. Sentry 캡처 레이어 (중복 방지 정책)

```
L1 Global        instrumentation-client.ts   SDK 자동 (window.onerror 등)
L2 Boundary      error.tsx / global-error.tsx 클라이언트 렌더 에러 (digest 있으면 건너뜀)
L3 API           api-error-sentry.ts         5xx ApiError만 captureException (HttpClient throw 시점)
L4 Logger        sentry.client.ts (sink)     warn→message, error→exception (ApiError 제외)
```

- L4는 `isApiError(err)` 이면 캡처 건너뜀 → L3과 중복 제거
- L2는 `error.digest` 이면 캡처 건너뜀 → 서버 `onRequestError`와 중복 제거

### 4. Web Vitals

- **Vercel**: 프로젝트 → Analytics → Web Vitals (LCP/INP/CLS)
- **Sentry**: 예산 초과 시 `[web-vitals] LCP budget exceeded` 등 warning 메시지

## 수집 누락 판별

| 증상 | 원인 후보 |
|------|-----------|
| GA 이벤트 없음 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` 미설정, 광고 차단기 |
| Sentry 이슈 없음 | DSN 미설정, 4xx만 발생(5xx만 capture) |
| page_view 중복 | 정상 — query 변경 시마다 1회 |

## CI 검증

- `pnpm --filter client test:unit` — `web-vitals.test.ts`, `api-error-sentry.test.ts`

## 제품 KPI 연계 검증

GA4만으로는 도메인 CVR·추천 지연을 확정할 수 없다. staging에서 아래를 **추가** 확인한다.

1. 레시피 상세·관심 토글 후 Mongo `event_logs`에 `recipe.view`, `recipe.favorites_add` 반영.
2. Consumer `/metrics`에서 `kafka_messages_processed_total{topic="user-events"}` 증가.
3. `recipe.favorites_add` 문서의 `processedAt - occurredAt`이 운영 목표(예: p95 &lt; 5s) 이내인지 샘플 확인.

상세: [product_kpi_runbook.md](./product_kpi_runbook.md) §3.

## 관련 코드

- Sentry init 옵션(SSOT): `client/src/lib/config/sentry.config.ts`
- Sentry 초기화 (L1): `client/src/instrumentation-client.ts`
- Sentry 서버/엣지: `client/sentry.server.config.ts`, `client/sentry.edge.config.ts`
- Sentry 레이어 헬퍼 (L3/L4): `client/src/lib/observability/sentry.client.ts`, `client/src/lib/observability/api-error-sentry.ts`
- 부트스트랩: `client/src/components/observability/ObservabilityBootstrap.tsx`
- 이벤트 상수: `client/src/lib/observability/analytics-events.ts`
- 계측 체크리스트: [frontend_event_instrumentation.md](./frontend_event_instrumentation.md)
