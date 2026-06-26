# 제품 KPI 알림·장애 대응 Runbook

운영(Ops)과 제품(Product) 알림을 분리한다.

## 1. 알림 임계치 (1차)

### 1.0 Ops — 인프라·API·Kafka

| Alert ID | KPI / 대상 | 조건 | 심각도 | 채널 |
|----------|------------|------|--------|------|
| `ALERT_TARGET_DOWN` | Prometheus scrape | `up{job=~mealio-producer\|mealio-consumer\|pushgateway}` == 0 for 3m | critical | Slack #ops + on-call |
| `ALERT_PRODUCER_5XX_RATE` | Producer HTTP | 5xx rate > 1% for 10m | critical | Slack #ops + on-call |
| `ALERT_PRODUCER_LATENCY_P95` | Producer HTTP | p95 > 2000ms for 10m | warning | Slack #ops |
| `ALERT_KAFKA_FAIL_RATE` | `kpi_kafka_fail_rate` | > 1% for 10m (`activity-events` or `user-events`) | warning | Slack #ops |
| `ALERT_KAFKA_FAIL_RATE_CRITICAL` | `kpi_kafka_fail_rate` | > 5% for 10m (동일 topic) | critical | Slack #ops + on-call |
| `ALERT_KAFKA_LAG` | `kpi_kafka_lag_p95` | `kafka_consumer_lag` > 1000 for 15m | critical | Slack #ops + on-call |
| `ALERT_DLQ_SPIKE` | `kpi_dlq_backlog` | failed rate 3x over 1h baseline for 10m | warning | Slack #ops |
| `ALERT_CHATBOT_LAG` | chatbot-requests lag | lag > 50 for 10m | critical | Slack #ops + on-call |
| `ALERT_CHATBOT_FAIL_RATE` | chatbot-requests fail | fail rate > 1% for 10m | warning | Slack #ops |
| `ALERT_CHATBOT_PROCESSING_P95` | chatbot processing | p95 > 30s for 15m | warning | Slack #ops |
| `ALERT_CACHE_INVALIDATION_LAG` | cache-invalidation lag | lag > 500 for 15m | warning | Slack #ops |
| `ALERT_CACHE_INVALIDATION_FAIL_RATE` | cache-invalidation fail | fail rate > 1% for 10m | warning | Slack #ops |

### 1.0.1 Runtime — Node·DB

| Alert ID | 대상 | 조건 | 심각도 | 채널 |
|----------|------|------|--------|------|
| `ALERT_DB_SLOW_QUERY_SPIKE` | Producer DB | slow query rate > 0.1/s for 10m | warning | Slack #ops |
| `ALERT_DB_P95_LATENCY` | Producer DB | query p95 > 1000ms for 10m | warning | Slack #ops |
| `ALERT_EVENT_LOOP_LAG` | Node.js | event loop p99 > 250ms for 10m | warning | Slack #ops |
| `ALERT_MEMORY_HIGH` | Node.js heap | used/total > 90% for 15m | warning | Slack #ops |
| `ALERT_HTTP_INFLIGHT` | Producer | in-flight requests > 100 for 5m | warning | Slack #ops |

### 1.0.2 Product — KPI·EventLog

| Alert ID | KPI | 조건 | 심각도 | 채널 |
|----------|-----|------|--------|------|
| `ALERT_RECO_LATENCY` | `kpi_recommendation_e2e_latency` | `user-events` processing p95 > 5000ms for 30m (EventLog proxy) | warning | Slack #product |
| `ALERT_CHATBOT_DAU` | `kpi_chatbot_dau_messages` | 7일 이동평균 -40% (`event_logs` MongoDB) | info | Slack #product |
| `ALERT_KPI_ROLLUP_STALE` | KPI rollup job | `computedAt` 36h+ 경과 | warning | Slack #product |

### 1.0.3 Recipe ingestion

| Alert ID | KPI | 조건 | 심각도 | 채널 |
|----------|-----|------|--------|------|
| `ALERT_RECIPE_INGESTION_STAGE_FAIL` | stage fail rate | `persist`/`parse-retrieve` fail rate > 5% for 30m | warning | Slack #ops |
| `ALERT_RECIPE_INGESTION_PERSIST_LAG` | persist trigger lag | `recipe-ingestion-persist-triggered` lag > 100 for 15m | warning | Slack #ops |
| `ALERT_RECIPE_INGESTION_EMBED_LAG` | embed-submit trigger lag | `recipe-ingestion-embed-submit-triggered` lag > 100 for 15m | warning | Slack #ops |
| `ALERT_RECIPE_INGESTION_PARSE_SUBMIT_LAG` | parse-submit trigger lag | `recipe-ingestion-parse-submit-triggered` lag > 100 for 15m | warning | Slack #ops |
| `ALERT_RECIPE_INGESTION_KAFKA_FAIL` | ingestion Kafka fail | `recipe-ingestion-*` topic fail rate > 1% for 15m | warning | Slack #ops |
| `ALERT_RECIPE_INGESTION_CLI_STALE` | CLI Pushgateway push | 마지막 push 24h+ 경과 | info | Slack #ops |
| `ALERT_INGESTION_LOW_CONFIDENCE` | parse confidence | low 비율 > 20% (1h) | info | Slack #ops |
| `ALERT_LLM_TOKEN_SPIKE` | LLM token usage | 24h baseline 대비 3x for 1h | warning | Slack #ops |

PromQL·대시보드: `observability/grafana/provisioning/dashboards/json/` (`mealio-ops.json`, `mealio-recipe-ingestion.json`, `mealio-ops-kafka-extended.json`, `mealio-infra.json`, `mealio-producer-api.json` 등) 및 알림 규칙 (`observability/grafana/provisioning/alerting/rules.yml`) 참조

### 1.1 임계치 초기값 근거

| Alert ID | 근거 |
|----------|------|
| `ALERT_TARGET_DOWN` 3m | scrape 실패는 즉시 대응. 짧은 재시작 flap은 3m으로 흡수 |
| `ALERT_PRODUCER_5XX_RATE` > 1% | API 가용성 SLO. 소량 5xx도 사용자 영향 큼 |
| `ALERT_PRODUCER_LATENCY_P95` > 2000ms | 모바일 UX·타임아웃 여유 |
| `ALERT_KAFKA_FAIL_RATE` > 1% | 정상 운영 시 실패율 < 0.1% 예상. 1%는 10배 이탈 기준으로 노이즈 필터링 |
| `ALERT_KAFKA_FAIL_RATE_CRITICAL` > 5% | Runbook L2 에스컬레이션 기준과 정합 |
| `ALERT_KAFKA_LAG` > 1000 | 단일 파티션 초당 ~100 메시지 기준, 10초 이상 지연 의미 |
| `ALERT_DLQ_SPIKE` 3x baseline | 점진 증가 vs 급증 구분을 위한 비율 기반 |
| `ALERT_CHATBOT_LAG` > 50 | 실시간 대화 UX. core topic보다 낮은 임계치 |
| `ALERT_CHATBOT_PROCESSING_P95` > 30s | SSE·LLM 체감 한계 |
| `ALERT_CACHE_INVALIDATION_LAG` > 500 | 비동기 토픽. 누적 시 Producer 캐시 stale |
| `ALERT_DB_SLOW_QUERY_SPIKE` > 0.1/s | 500ms 초과 쿼리 급증 (policy `SLOW_QUERY_THRESHOLD_MS`) |
| `ALERT_EVENT_LOOP_LAG` > 250ms | Node 블로킹 조기 감지 |
| `ALERT_MEMORY_HIGH` > 90% | OOM 전조 |
| `ALERT_RECO_LATENCY` > 5000ms | UX 체감 한계(5s). `user-events` histogram은 EventLog E2E proxy |
| `ALERT_CHATBOT_DAU` -40% 7d MA | 주말/공휴일 변동 감안 후 40% 이탈이면 이상 신호 |
| `ALERT_KPI_ROLLUP_STALE` 36h | 일 롤업 + 여유. product KPI 알림 신뢰성 전제 |
| `ALERT_RECIPE_INGESTION_STAGE_FAIL` > 5% | persist·parse-retrieve는 downstream 영향 큼. batch 특성상 30m 윈도 |
| `ALERT_RECIPE_INGESTION_*_LAG` > 100 | ingestion trigger는 저빈도·소량. 적체 조기 감지 |
| `ALERT_RECIPE_INGESTION_CLI_STALE` 24h | fetch/parse-retrieve cron 주기 대비 CLI 미실행 감지 |
| `ALERT_INGESTION_LOW_CONFIDENCE` > 20% | parse 품질 이상 조기 감지 |
| `ALERT_LLM_TOKEN_SPIKE` 3x | 비용·quota 급증 방지 |

### 1.2 재조정 주기

- **초기(런칭 후 4주)**: 주간 리뷰 — 실제 baseline 수집 후 임계치 재설정.
- **안정기**: 월간 리뷰 — 오탐/누락 비율 확인, 필요 시 ±20% 범위 내 조정.
- **주요 변경(인프라 스케일, 기능 출시) 직후**: 즉시 ad-hoc 리뷰.

## 2. 장애 대응 절차

### 2.1 Kafka lag 급증 (`ALERT_KAFKA_LAG`)

1. Grafana Ops 패널에서 `topic`, `partition`, `consumer_group` 확인.
2. Consumer 로그: `kafka_message_failed`, `sentryEventId`, `correlationId` 검색.
3. `user-events` lag + recommendation latency 동반 상승 시 → §2.3 추천 경합 의심.
4. 완화: Consumer 스케일 아웃, poison message DLQ 격리, lag 원인 파티션 집중 소비.

**체크리스트**

- [ ] `/ready` 정상
- [ ] `METRICS_ENABLED=true`
- [ ] MSK/Kafka broker health
- [ ] DLQ 토픽 메시지 샘플링

### 2.2 처리 실패율 상승 (`ALERT_KAFKA_FAIL_RATE` / `ALERT_KAFKA_FAIL_RATE_CRITICAL`)

1. `kafka_messages_failed_total` by `topic` 라벨 분해.
2. Sentry: `topic`, `consumerGroup`, `partition`, `offset` 태그로 이슈 필터.
3. 최근 배포·스키마 변경 여부 확인 (`SchemaValidator` 실패 패턴).
4. DLQ 재처리 정책에 따라 수동 replay 또는 skip 문서화.
5. fail rate > 5%이면 L2 에스컬레이션 (§4).

### 2.3 추천 반영 지연 (`ALERT_RECO_LATENCY`)

1. EventLog 샘플: `type=recipe.favorites_add`, `processedAt - occurredAt`.
2. PostgreSQL: `RecommendationRepository` 트랜잭션 lock/wait (Consumer §2.6.3).
3. `user-events` processing histogram p95와 상관 확인.
4. `activity-events` recommendation warn 로그(swallow) 빈도 — EventLog는 성공, 추천만 실패 가능.

### 2.4 제품 CVR 급락 (수동 — `mealio-product` 대시보드)

1. EventLog 일 롤업: `pnpm --filter consumer run job:kpi-rollup` 실행 후 `db.kpi_rollups.find({ kpiId: "kpi_recipe_favorite_cvr" })` 확인.
2. GA4 퍼널 `recipe_viewed` → `recipe_saved` 교차 검증.
3. 프론트 배포·API 장애(조회수 POST 실패) 여부 — `recipe.view` 분모 감소?
4. 데이터 이슈 vs 실제 UX 회귀 구분 후 제품 티켓.

수동 검증 시나리오는 [validation.md](./validation.md) §7~9를 따른다.

### 2.5 Recipe ingestion 단계 실패 (`ALERT_RECIPE_INGESTION_STAGE_FAIL`)

1. **Mealio — Recipe Ingestion Pipeline** (`mealio-recipe-ingestion`)에서 stage·outcome 분해.
2. MongoDB `recipe_ingestion_jobs` failed 목록·`errorMessage` 확인.
3. persist 실패: PostgreSQL·재료 매칭 로그. parse-retrieve 실패: OpenAI Batch 상태·`batchId`.
4. `--retry-failed` CLI 또는 수동 `job:recipe-ingestion-persist --job-id`로 복구.

### 2.6 Persist trigger lag (`ALERT_RECIPE_INGESTION_PERSIST_LAG`)

1. **Mealio Ops — Kafka Ingestion & Chatbot**에서 `recipe-ingestion-persist-triggered` lag 확인.
2. always-on persist consumer `/ready`, `METRICS_ENABLED` 확인.
3. parse-retrieve CLI·consumer 처리량과 lag 상관 확인.

### 2.7 CLI push stale (`ALERT_RECIPE_INGESTION_CLI_STALE`)

1. **Mealio Ops — Infra & Pushgateway**에서 `push_time_seconds` 경과 확인.
2. cron/ECS scheduled task·`PUSHGATEWAY_URL` 환경 변수 확인.
3. 수동 `pnpm run recipe-ingestion:fetch` 실행 후 Pushgateway 메트릭 갱신 여부 확인.

### 2.8 Scrape target DOWN (`ALERT_TARGET_DOWN`)

1. **Mealio Ops — Infra & Pushgateway** Target health 패널에서 DOWN job 확인.
2. Producer/Consumer 프로세스·`METRICS_ENABLED`·`METRICS_PORT`·Docker 네트워크 확인.
3. Pushgateway DOWN 시 CLI ingestion 메트릭만 누락 — always-on consumer는 별도 scrape.

### 2.9 Producer API 장애 (`ALERT_PRODUCER_5XX_RATE` / `ALERT_PRODUCER_LATENCY_P95`)

1. **Mealio Ops — Producer API & DB**에서 route·status_code 분해.
2. Sentry 5xx 이슈·최근 배포 확인.
3. 동반 `ALERT_DB_*` 알림 시 DB 병목 우선 조사.

### 2.10 Chatbot 지연·실패 (`ALERT_CHATBOT_*`)

1. **Mealio Ops — Kafka Ingestion & Chatbot** lag·fail·p95 확인.
2. OpenAI quota·credit 부족·tool 오류 로그 확인.
3. `chatbot-requests-dlq` 샘플링.

### 2.11 캐시 무효화 적체 (`ALERT_CACHE_INVALIDATION_*`)

1. `cache-invalidation` consumer 로그·Redis 연결 확인.
2. Producer API가 stale 캐시를 반환하는지 spot check.
3. lag 지속 시 consumer 재시작·Redis health 확인.

### 2.12 KPI 롤업 stale (`ALERT_KPI_ROLLUP_STALE`)

1. `pnpm --filter consumer run job:kpi-rollup` 수동 실행.
2. cron/ECS scheduled task·MongoDB 접근 권한 확인.
3. 복구 후 `mealio-product` 대시보드 CVR 데이터 갱신 확인.

## 3. 로그·추적 필드

| 필드 | 용도 |
|------|------|
| `correlationId` | Producer ↔ Consumer ↔ Sentry ↔ Client |
| `topic`, `partition`, `offset` | Kafka 실패 |
| `sentryEventId` | DLQ 로그 ↔ Sentry 이슈 |
| `actor.userId` | EventLog 퍼널 |

## 4. 에스컬레이션

| 단계 | 조건 | 담당 |
|------|------|------|
| L1 | warning 30m 미해소 | Platform on-call |
| L2 | critical lag·target down·5xx·fail rate > 5% | Platform + Backend lead |
| L3 | CVR/DAU 장기 이탈 + 시스템 정상 | Product owner |

## 5. 관련 문서

- [product_kpi_contract.md](./product_kpi_contract.md)
- [aggregation_pipeline.md](./aggregation_pipeline.md)
- [event_dictionary.md](./event_dictionary.md)
- 통합 검증: [validation.md](./validation.md)
