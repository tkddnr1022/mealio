# 제품 KPI 알림·장애 대응 Runbook

운영(Ops)과 제품(Product) 알림을 분리한다.

## 1. 알림 임계치 (1차)

| Alert ID | KPI | 조건 | 심각도 | 채널 |
|----------|-----|------|--------|------|
| `ALERT_KAFKA_FAIL_RATE` | `kpi_kafka_fail_rate` | > 1% for 10m (topic `activity-events` or `user-events`) | warning | Slack #ops |
| `ALERT_KAFKA_LAG` | `kpi_kafka_lag_p95` | `kafka_consumer_lag` > 1000 for 15m | critical | Slack #ops + on-call |
| `ALERT_DLQ_SPIKE` | `kpi_dlq_backlog` | `rate(kafka_messages_failed_total[5m])` 3x over 1h baseline | warning | Slack #ops |
| `ALERT_RECO_LATENCY` | `kpi_recommendation_e2e_latency` | EventLog p95 > 5000ms for 1h (daily job or ad-hoc) | warning | Slack #product |
| `ALERT_CVR_DROP` | `kpi_recipe_favorite_cvr` | 일 CVR 전주 대비 -30% (롤업 후) | info | Slack #product |
| `ALERT_CHATBOT_DAU` | `kpi_chatbot_dau_messages` | 7일 이동평균 -40% | info | Slack #product |
| `ALERT_RECIPE_INGESTION_STAGE_FAIL` | recipe ingestion stage fail rate | `persist`/`parse-retrieve` fail rate > 5% for 30m | warning | Slack #ops |
| `ALERT_RECIPE_INGESTION_PERSIST_LAG` | persist trigger lag | `recipe-ingestion-persist-triggered` lag > 100 for 15m | warning | Slack #ops |
| `ALERT_RECIPE_INGESTION_CLI_STALE` | CLI Pushgateway push | 마지막 push 24h+ 경과 | info | Slack #ops |

PromQL·대시보드: `observability/grafana/provisioning/dashboards/json/` (`mealio-ops.json`, `mealio-recipe-ingestion.json`, `mealio-ops-kafka-extended.json`, `mealio-infra.json` 등) 및 알림 규칙 (`observability/grafana/provisioning/alerting/rules.yml`) 참조

### 1.1 임계치 초기값 근거

| Alert ID | 근거 |
|----------|------|
| `ALERT_KAFKA_FAIL_RATE` > 1% | 정상 운영 시 실패율 < 0.1% 예상. 1%는 10배 이탈 기준으로 노이즈 필터링 |
| `ALERT_KAFKA_LAG` > 1000 | 단일 파티션 초당 ~100 메시지 기준, 10초 이상 지연 의미 |
| `ALERT_DLQ_SPIKE` 3x baseline | 점진 증가 vs 급증 구분을 위한 비율 기반 |
| `ALERT_RECO_LATENCY` > 5000ms | UX 체감 한계(5s). 추천 결과가 즉시 반영되지 않아도 UX 저하는 제한적 |
| `ALERT_CVR_DROP` -30% WoW | 자연 변동(±10~15%) 대비 2배 이탈 시 조사 트리거 |
| `ALERT_CHATBOT_DAU` -40% 7d MA | 주말/공휴일 변동 감안 후 40% 이탈이면 이상 신호 |
| `ALERT_RECIPE_INGESTION_STAGE_FAIL` > 5% | persist·parse-retrieve는 downstream 영향 큼. batch 특성상 30m 윈도 |
| `ALERT_RECIPE_INGESTION_PERSIST_LAG` > 100 | ingestion trigger는 저빈도·소량. 100은 parse 완료 후 persist 적체 조기 감지 |
| `ALERT_RECIPE_INGESTION_CLI_STALE` 24h | fetch/parse-retrieve cron 주기 대비 CLI 미실행 감지 |

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

### 2.2 처리 실패율 상승 (`ALERT_KAFKA_FAIL_RATE`)

1. `kafka_messages_failed_total` by `topic` 라벨 분해.
2. Sentry: `topic`, `consumerGroup`, `partition`, `offset` 태그로 이슈 필터.
3. 최근 배포·스키마 변경 여부 확인 (`SchemaValidator` 실패 패턴).
4. DLQ 재처리 정책에 따라 수동 replay 또는 skip 문서화.

### 2.3 추천 반영 지연 (`ALERT_RECO_LATENCY`)

1. EventLog 샘플: `type=recipe.favorites_add`, `processedAt - occurredAt`.
2. PostgreSQL: `RecommendationRepository` 트랜잭션 lock/wait (Consumer §2.6.3).
3. `user-events` processing histogram p95와 상관 확인.
4. `activity-events` recommendation warn 로그(swallow) 빈도 — EventLog는 성공, 추천만 실패 가능.

### 2.4 제품 CVR 급락 (`ALERT_CVR_DROP`)

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
| L2 | critical lag 또는 fail rate > 5% | Platform + Backend lead |
| L3 | CVR/DAU 장기 이탈 + 시스템 정상 | Product owner |

## 5. 관련 문서

- [product_kpi_contract.md](./product_kpi_contract.md)
- [aggregation_pipeline.md](./aggregation_pipeline.md)
- [event_dictionary.md](./event_dictionary.md)
- 통합 검증: [validation.md](./validation.md)
