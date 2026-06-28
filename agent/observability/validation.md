# 관측성 통합 검증 시나리오

관측성 스택 전체를 대상으로 한 수동 검증 체크리스트. staging 또는 로컬 Compose 인프라(`docker/compose-database.yml` 등, `agent/common/deployment_strategy.md` §4)에서 수행한다.

---

## 1. 사전 조건

### 환경 변수

| 변수 | 위치 | staging/prod | 로컬 |
|------|------|--------------|------|
| `SENTRY_DSN_PRODUCER` | Producer `.env` | 설정 | 비워도 됨 (no-op) |
| `SENTRY_DSN_CONSUMER` | Consumer `.env` | 설정 | 비워도 됨 (no-op) |
| `NEXT_PUBLIC_SENTRY_DSN` | Client `.env` | 설정 | 비워도 됨 |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Client `.env` | 설정 | 비워도 됨 |
| `METRICS_ENABLED` | Producer `.env`, Consumer `.env` | `true` | `true` |
| `METRICS_PORT` | Producer `.env`, Consumer `.env` | 설정 (`METRICS_ENABLED=true` 시) | Producer 예: `9100`, Consumer 예: `9101` |
| `SLOW_QUERY_THRESHOLD_MS` | Producer `.env`, Consumer `.env` | 설정 (`METRICS_ENABLED=true` 시) | 예: `500` |
| `PUSHGATEWAY_URL` | Consumer `.env` | CLI ingestion 메트릭 push 시 설정 | 예: `http://localhost:9091` (호스트), `http://pushgateway:9091` (Compose) |
| `PUSHGATEWAY_PORT` | 루트 `.env.docker` | Compose Pushgateway 호스트 포트 | 예: `9091` |
| `SLACK_OPS_WEBHOOK_URL` | Grafana / alerting | 설정 | 선택 |
| `SLACK_PRODUCT_WEBHOOK_URL` | Grafana / alerting | 설정 | 선택 |

### 인프라

- `docker compose -f docker/compose-database.yml -f docker/compose-kafka.yml -f docker/compose-monitoring.yml up -d` — Kafka, Redis, PostgreSQL, MongoDB, Prometheus, **Pushgateway**, Grafana 정상 기동.
- Producer/Consumer 서버 기동 완료.
- Client 앱 빌드·서빙 (로컬: `pnpm --filter client dev`).

---

## 2. 헬스·Readiness

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 2.1 | `GET /health` 호출 | `200 OK` |
| 2.2 | `GET /ready` 호출 | `200` — PostgreSQL, MongoDB 연결 정상 |
| 2.3 | PostgreSQL 또는 MongoDB 중단 후 `/ready` | `503` 또는 의존 서비스 실패 표시 |
| 2.4 | Compose 서비스별 healthcheck | 모든 서비스 `healthy` |

---

## 3. 로그·분산 추적 (Correlation ID)

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 3.1 | 클라이언트 → Producer API 호출 | 응답 헤더 `X-Correlation-Id` 존재 |
| 3.2 | 요청에 `X-Correlation-Id` 직접 지정 | 동일 ID가 응답 헤더·Producer 로그에 전파 |
| 3.3 | Producer → Kafka 메시지 발행 | 메시지 헤더 또는 payload에 `correlationId` 포함 |
| 3.4 | Consumer 처리 로그 | `correlationId` 필드가 구조화 로그에 포함 |
| 3.5 | Consumer 실패 → DLQ | DLQ 로그에 `correlationId`, `sentryEventId` 포함 |

---

## 4. 백엔드 메트릭 (Prometheus)

### 4.1 Producer

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 4.1.1 | `METRICS_PORT`의 `GET /metrics` 호출 | Prometheus 텍스트 포맷 반환 |
| 4.1.2 | API 요청 수회 후 `/metrics` | `http_request_duration_seconds` 히스토그램 증가 |
| 4.1.3 | DB 쿼리 실행 후 `/metrics` | Prisma/Mongoose 쿼리 duration 메트릭 존재 |
| 4.1.4 | 슬로우 쿼리 임계 초과 유발 | `slow_query_total` counter 증가 + 로그 출력 |

### 4.2 Consumer

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 4.2.1 | Consumer `/metrics` 호출 | `kafka_consumer_lag`, `kafka_messages_processed_total`, `kafka_messages_failed_total` 존재 |
| 4.2.2 | 테스트 메시지 처리 후 | `kafka_messages_processed_total` 증가 |
| 4.2.3 | 처리 실패 유발 후 | `kafka_messages_failed_total` 증가, DLQ 전송 |
| 4.2.4 | `kafka_message_processing_duration_ms` | topic별 히스토그램 수집 정상 |
| 4.2.5 | always-on Consumer `/metrics` | `recipe_ingestion_stage_total`, `recipe_ingestion_stage_latency_ms` 존재 (Kafka 경로 persist 등) |
| 4.2.6 | persist 성공/실패 시나리오 실행 | `recipe_ingestion_parse_confidence_total`, `recipe_ingestion_ingredient_match_total` 증가 |
| 4.2.7 | retrieve 처리 후 | `recipe_ingestion_llm_tokens_total` 증가 |
| 4.2.8 | recipe ingestion CLI 실행 (`PUSHGATEWAY_URL` 설정) | Pushgateway에 `recipe_ingestion_stage_total{job="recipe_ingestion_cli",stage=…}` 노출, Prometheus `pushgateway` 타겟 UP |

### 4.3 Prometheus 수집

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 4.3.1 | `curl localhost:9090/api/v1/targets` | Producer·Consumer·**Pushgateway** 타겟 `UP` |
| 4.3.2 | Grafana Explore에서 PromQL 쿼리 | 데이터 반환 정상 |

---

## 5. 에러 추적 (Sentry)

### 5.0 샘플링·init 설정 (코드 SSOT)

| 런타임 | init 진입점 | 샘플링 설정 |
|--------|-------------|-------------|
| Client (browser) | `client/src/instrumentation-client.ts` | `client/src/lib/config/sentry.config.ts` |
| Client (Next server/edge) | `client/sentry.server.config.ts`, `client/sentry.edge.config.ts` | 동일 |
| Producer / Consumer | `initSentry()` in `main.ts` | `server/shared/src/config/sentry.config.ts` |

**Production 권장값 (코드 상수)**:

| 옵션 | Client | Server (Next·Nest) |
|------|--------|---------------------|
| `sampleRate` | 1.0 | 1.0 |
| `profilesSampleRate` | 0.2 | 0.2 |
| `replaysSessionSampleRate` | 0.01 | — |
| `replaysOnErrorSampleRate` | 1.0 | — |
| `tracesSampler` | `/api/health`, `/api/metrics` → 0; `/api/*` → 0.2; 페이지 → 0.05 | `/health`, `/metrics` → 0; 그 외 → 0.1 |

Development에서는 위 비율·트레이스 샘플링을 1.0(또는 health/metrics 제외 0)으로 둔다.

### 5.1 Producer

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 5.1.1 | 의도적 5xx 유발 (미구현 라우트 등) | Sentry 이슈 생성: `service=producer`, `correlationId`, `feature` 태그 |
| 5.1.2 | 4xx 응답 유발 | Sentry에 **보고되지 않아야** 함 |
| 5.1.3 | `X-Correlation-Id` 지정 요청 → 5xx | Sentry 이슈의 `correlationId` 태그가 요청 헤더와 일치 |

### 5.2 Consumer

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 5.2.1 | Kafka 처리 실패 유발 | Sentry 이슈: `topic`, `consumerGroup`, `partition`, `offset`, `correlationId` 태그 |
| 5.2.2 | DLQ 로그 확인 | `kafka_message_failed` 로그에 `sentryEventId` 필드 존재 |

### 5.3 Client

**캡처 레이어 구조** (`@sentry/nextjs` 기반):

| 레이어 | 파일 | 역할 | 중복 방지 |
|--------|------|------|-----------|
| L1 Global | `instrumentation-client.ts` | SDK 자동 (window.onerror / unhandledrejection) | Dedupe integration |
| L2 Boundary | `error.tsx` · `global-error.tsx` | React 렌더링 에러 (클라이언트 only) | `digest` 있으면 건너뜀 (서버 onRequestError가 처리) |
| L3 API | `api-error-sentry.ts` | 5xx ApiError captureException (HttpClient throw 시점) | 4xx 제외 |
| L4 Logger | `sentry.client.ts` (log sink) | warn→message, error→exception | ApiError 건너뜀 (L3이 처리) |

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 5.3.1 | 5xx `ApiError` Toast 발생 | Sentry 이슈: `service:client`, `correlationId` 태그 (L3 경유) |
| 5.3.2 | `logger.error` 호출 (non-ApiError) | Sentry exception 수신 (L4 경유, DSN 설정 시) |
| 5.3.3 | `logger.error` 호출 (ApiError) | Sentry 이벤트 생성 **안 됨** (L3에서 이미 처리) |
| 5.3.4 | 클라이언트 렌더링 에러 | Sentry 이슈: `boundary:root` 태그 (L2 경유) |
| 5.3.5 | 서버 컴포넌트 에러 → error.tsx 도달 | 클라이언트 중복 전송 **안 됨** (digest 존재, 서버 onRequestError가 처리) |

---

## 6. 클라이언트 분석 (GA4 · Web Vitals)

> 상세 검증 절차(페이지뷰, 도메인 이벤트, Web Vitals)는 [frontend_observability_runbook.md](./frontend_observability_runbook.md)를 따른다.

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 6.1 | GA4 페이지뷰·도메인 이벤트 | `frontend_observability_runbook.md` §1~2 참조 |
| 6.2 | Web Vitals (LCP/INP/CLS) | `frontend_observability_runbook.md` §4 참조 |
| 6.3 | 수집 누락 판별 | `frontend_observability_runbook.md` "수집 누락 판별" 참조 |

---

## 7. EventLog 파이프라인 (Kafka → MongoDB)

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 7.1 | 로그인 → 레시피 상세 진입 | Mongo `event_logs`에 `type: 'recipe.view'` 1건, `actor.userId` 포함 |
| 7.2 | 관심 레시피 추가 | `type: 'recipe.favorites_add'` 1건, `processedAt > occurredAt` |
| 7.3 | 챗봇 메시지 전송 | `type: 'chatbot.message'` 1건 |
| 7.4 | GA4와 교차 검증 | 동일 시나리오에서 `recipe_viewed`, `recipe_saved` GA 실시간 이벤트도 확인 |
| 7.5 | 추천 반영 지연 확인 | `recipe.favorites_add`의 `processedAt - occurredAt`이 p95 < 5s 이내 |

---

## 8. KPI 롤업 배치

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 8.1 | `pnpm --filter consumer run job:kpi-rollup` | `kpi_rollups` 컬렉션에 3건 (CVR, CTR, latency) |
| 8.2 | 동일 명령 재실행 | 문서 수 변화 없음 (upsert idempotent) |
| 8.3 | `pnpm --filter consumer run job:kpi-rollup --backfill 3` | 최근 3일 롤업 생성 |
| 8.4 | `db.kpi_rollups.find({ date: "YYYY-MM-DD" })` | `kpiId`, `value`, `numerator`, `denominator`, `computedAt` 필드 정상 |

---

## 8-A. Recipe Ingestion 운영 검증

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 8A.1 | `job:recipe-ingestion-fetch --fetch-limit 50` 실행 | `recipe_ingestion_jobs`에 `fetched` 증가; Pushgateway/Prometheus에서 `recipe_ingestion_stage_total{job="recipe_ingestion_cli",stage="fetch",outcome="success"}` 증가 |
| 8A.2 | `job:recipe-ingestion-parse-submit --run-id <runId>` 실행 | `parse_submitted` 증가; Pushgateway에서 `stage="parse-submit",outcome="success"` 증가 |
| 8A.3 | `job:recipe-ingestion-parse-retrieve` 실행 | `parse_retrieved` 증가, `recipe-ingestion-persist-triggered` lag이 감소 방향 |
| 8A.4 | `job:recipe-ingestion-parse-submit --retry-failed --retry-failed-limit 20` 실행 | `failed -> fetched` 재큐잉 후 재제출 진행 |
| 8A.5 | `job:recipe-ingestion-persist --job-id <jobId>` 실행 | 지정 jobId direct persist 실행 및 상태 전이 확인 |
| 8A.6 | `job:recipe-ingestion-embed-submit --run-id <runId>` 실행 | `embed_submitted` 증가, `recipe-ingestion-embed-submit-triggered` lag 감소 방향 |
| 8A.7 | `job:recipe-ingestion-embed-retrieve --run-id <runId>` 실행 | `embed_retrieved` 증가, RecipeEmbedding upsert 확인 |
| 8A.8 | persist/embed 실패 유도 후 복구 | `recipe_ingestion_stage_total{stage=\"persist|embed-retrieve\",outcome=\"failed\"}` 증가 후 재시도 시 `success` 증가 |
| 8A.9 | fetch CLI 실행 후 로그 grep | JSON 로그에 `event=recipe_ingestion_cli_started`, `correlationId`, `stage=fetch` 존재 |
| 8A.10 | parse-submit 성공 실행 후 로그 grep | `event=recipe_ingestion_batch_submitted`, `batchId`, `runId` 존재 |
| 8A.11 | parse-retrieve 대상 0건 실행 | `event=recipe_ingestion_stage_no_op`, `stage=parse-retrieve` 존재 |
| 8A.12 | 동일 `correlationId`로 stage_started → stage_completed 체인 | 단일 CLI 실행 내 lifecycle 이벤트 연속 확인 |
| 8A.13 | `PUSHGATEWAY_URL` 미설정 상태에서 fetch CLI 실행 | job 정상 완료, push skip (warn 없음) |

---

## 9. Grafana 대시보드·알림

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 9.1 | `http://localhost:3030` 접속 (admin/admin) | Grafana 로그인 성공 |
| 9.2 | **Mealio Ops — Kafka Health** (`mealio-ops`) | fail rate, lag, processing p95 패널 데이터 표시 |
| 9.3 | **Mealio Product — KPI Rollups** (`mealio-product`) | CVR, CTR, latency 패널 데이터 표시 |
| 9.4 | Alerting > Alert rules | `mealio-ops-alerts`, `mealio-runtime-alerts`, `mealio-product-alerts`, `mealio-recipe-ingestion-alerts` 그룹 및 Runbook §1 Alert ID 존재 |
| 9.5 | Prometheus datasource 쿼리 | Grafana Explore에서 정상 반환 |
| 9.6 | MongoDB datasource 연결 (`mongodb` UID) | KPI 롤업 데이터 조회 가능 |
| 9.6.1 | PostgreSQL datasource 연결 (`postgresql` UID) | `grafana_recipe_catalog_snapshot` 조회 가능 |
| 9.6.2 | **Mealio Product — Domain Snapshot** (`mealio-product-domain`) | catalog, embedding, signup, recommendation 패널 표시 |
| 9.7 | **Mealio — Recipe Ingestion Pipeline** (`mealio-recipe-ingestion`) | stage throughput, lag, Mongo backlog 패널 표시 |
| 9.8 | **Mealio Ops — Kafka Ingestion & Chatbot** (`mealio-ops-kafka-extended`) | ingestion·chatbot 토픽 lag/fail rate 표시 |
| 9.9 | **Mealio Ops — Producer API & DB** (`mealio-producer-api`) | HTTP p95, DB slow query 패널 표시 |
| 9.10 | **Mealio Product — EventLog** (`mealio-product-events`) | chatbot DAU, search volume 패널 표시 |
| 9.11 | **Mealio Ops — Infra & Pushgateway** (`mealio-infra`) | scrape UP, CLI push stale 패널 표시 |
| 9.12 | Alerting > Notification policies | `DatasourceNoData`·`DatasourceError`는 mute route 적용, Slack 미발송 |

---

## 10. 회귀·안전성

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 10.1 | `SENTRY_DSN_PRODUCER` / `SENTRY_DSN_CONSUMER` 비움 | 앱 기동·요청·Kafka 처리 모두 정상 (no-op) |
| 10.2 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` 비움 | 앱 기동 정상, GA 이벤트 미전송 |
| 10.3 | `METRICS_ENABLED=false` | `/metrics` 엔드포인트 비활성화, 서버 기동 정상 |
| 10.4 | `METRICS_ENABLED=true` | `/metrics`·Consumer lag 메트릭 정상 수집 |

---

## 11. CI 자동 검증

| 대상 | 명령 |
|------|------|
| Client Web Vitals·Sentry 유닛 | `pnpm --filter client test:unit` — `web-vitals.test.ts`, `api-error-sentry.test.ts` |
| Producer 메트릭·모니터링 유닛 | `pnpm --filter producer test` — `metrics.service.spec.ts`, `http-metrics.middleware.spec.ts` 등 |
| Consumer 메트릭 유닛 | `pnpm --filter consumer test` — `consumer-metrics.service.spec.ts`, `metrics-push.spec.ts` 등 |
| Shared observability config | `pnpm --filter shared test` — `observability.config.spec.ts` |

---

## 12. 수집 누락 트러블슈팅

| 증상 | 원인 후보 | 확인 방법 |
|------|-----------|-----------|
| GA 이벤트 없음 | `NEXT_PUBLIC_GA_MEASUREMENT_ID` 미설정, 광고 차단기 | 브라우저 Network 탭에서 `collect?` 요청 확인 |
| Sentry 이슈 없음 | DSN 미설정, 4xx만 발생 (5xx만 capture) | 의도적 5xx 유발 후 Sentry 대시보드 확인 |
| `page_view` 중복 | 정상 동작 — query 변경 시마다 1회 발생 | — |
| Prometheus 메트릭 없음 | `METRICS_ENABLED=false`, 타겟 DOWN | `/metrics` 직접 호출, Prometheus targets 확인 |
| CLI ingestion 메트릭 없음 | `PUSHGATEWAY_URL` 미설정, Pushgateway 미기동 | Pushgateway `:9091/metrics` 확인, `PUSHGATEWAY_URL`·Prometheus `pushgateway` 타겟 확인 |
| EventLog 누락 | Kafka 연결 실패, Consumer 미기동 | Consumer 로그, `kafka_messages_failed_total` 확인 |
| KPI 롤업 누락 | 배치 미실행, MongoDB 접근 권한 | `job:kpi-rollup` 수동 실행, 접근 권한 확인 |
| Grafana 패널 빈 값 | datasource 미연결, 프로비저닝 미적용 | datasource 설정·UID 확인 |

---

## 관련 문서

- 프론트 계측 체크리스트: [frontend_event_instrumentation.md](./frontend_event_instrumentation.md)
- KPI 계약·SSOT: [product_kpi_contract.md](./product_kpi_contract.md)
- 이벤트 사전: [event_dictionary.md](./event_dictionary.md)
- KPI 알림·장애 대응: [product_kpi_runbook.md](./product_kpi_runbook.md)
