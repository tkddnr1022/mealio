# 제품·비즈니스 KPI 계약서

**운영 메트릭(Prometheus)** 과 **제품 이벤트(EventLog·GA4)** 를 분리하고, KPI별 단일 출처(SSOT)를 고정한다.

## 1. KPI 목록 (1차 고정)

| KPI ID | 지표명 | 모수 | 분모 | 집계 주기 | SSOT | 소유 |
|--------|--------|------|------|-----------|------|------|
| `kpi_recipe_favorite_cvr` | 레시피 상세 → 관심 전환율 | `recipe.favorites_add` (유저당 1일 1회) | `recipe.view` (동일 유저·일) | 일 | EventLog | Product |
| `kpi_search_click_rate` | 검색 클릭률 | `search.click` | `search.query` | 일 | EventLog | Product |
| `kpi_chatbot_dau_messages` | 챗봇 일간 메시지 유저 수 | `chatbot.message` distinct `actor.userId` | — | 일 | EventLog | Product |
| `kpi_ga_recipe_funnel` | GA 퍼널(상세→저장) | `recipe_saved` | `recipe_viewed` | 일 | GA4 | Product |
| `kpi_kafka_fail_rate` | Kafka 처리 실패율 | `kafka_messages_failed_total` 증분 | `processed + failed` 증분 | 5m | Prometheus (Consumer) | Platform |
| `kpi_kafka_lag_p95` | Consumer lag p95 | `kafka_consumer_lag` | — | 5m | Prometheus (Consumer) | Platform |
| `kpi_recommendation_e2e_latency` | 추천 반영 E2E 지연 p95 | `processedAt - occurredAt` (`recipe.favorites_add`) | — | 5m/일 | EventLog | Platform + Product |
| `kpi_dlq_backlog` | DLQ 적체 | DLQ 토픽 메시지 수(또는 failed rate) | — | 15m | Prometheus + Kafka | Platform |

### 1.1 집계 방식 분류

| 구분 | KPI ID | 집계 방법 |
|------|--------|-----------|
| **자동 일별 롤업** | `kpi_recipe_favorite_cvr`, `kpi_search_click_rate`, `kpi_recommendation_e2e_latency` | `job:kpi-rollup` 배치 → `kpi_rollups` 컬렉션 (Consumer) |
| **실시간 대시보드** | `kpi_kafka_fail_rate`, `kpi_kafka_lag_p95`, `kpi_dlq_backlog` | Prometheus recording rules / Grafana Ops 패널 |
| **GA4 대시보드** | `kpi_ga_recipe_funnel` | GA4 Explorations (BigQuery export 선택) |
| **수동/BI 조회** | `kpi_chatbot_dau_messages` | EventLog ad-hoc 또는 BI 도구로 조회 (롤업 확장 후보) |

### 1.2 계산식 상세

**`kpi_recipe_favorite_cvr`**

```
CVR = COUNT(DISTINCT userId WHERE type='recipe.favorites_add' AND day=D)
    / COUNT(DISTINCT userId WHERE type='recipe.view' AND day=D)
```

- 비로그인 `recipe.view`는 `actor.userId` 없음 → 퍼널 분모에서 제외하거나 IP 기반 보조 지표로 분리 집계한다.
- GA 보조: `kpi_ga_recipe_funnel` = `recipe_saved` / `recipe_viewed` (세션·디바이스 기준, EventLog와 수치 차이 허용).

**`kpi_search_click_rate`**

```
CTR = COUNT(type='search.click', day=D) / COUNT(type='search.query', day=D)
```

**`kpi_chatbot_dau_messages`**

```
DAU = COUNT(DISTINCT actor.userId WHERE type='chatbot.message' AND day=D)
```

**`kpi_kafka_fail_rate`** (topic·consumer_group 라벨)

```
fail_rate = rate(kafka_messages_failed_total[5m])
          / (rate(kafka_messages_processed_total[5m]) + rate(kafka_messages_failed_total[5m]))
```

- `activity-events`, `user-events`를 우선 모니터링한다.

**`kpi_kafka_lag_p95`**

```
lag_p95 = histogram_quantile(0.95, kafka_consumer_lag)  -- 또는 max by topic
```

**`kpi_recommendation_e2e_latency`**

```
latency_ms = processedAt - occurredAt  -- EventLog type='recipe.favorites_add'
p95 = PERCENTILE(latency_ms, 95) over 5m or daily rollup
```

- `user-events` 처리 후 `RecommendationHandler` 실행까지 포함. Consumer §2.6 Top N 재정렬 트랜잭션 경합 시 tail 증가.
- 보조: `kafka_message_processing_duration_ms` histogram (topic=`user-events`) p95.

## 2. 수집 경로 분리 (SSOT 원칙)

| 데이터 성격 | 수집 경로 | 금지 사항 |
|-------------|-----------|-----------|
| UI 퍼널·마케팅 | GA4 (`analytics.ts` → `ga-dispatcher`) | EventLog에 `recipe_viewed` 등 프론트 이름 저장 |
| 도메인·감사·추천 입력 | EventLog ← Kafka (`activity-events`, `user-events`, `chatbot-requests`) | GA에 조회수·재료 CRUD 중복 전송 |
| 가용성·처리량 | Prometheus Consumer `/metrics` | EventLog에 HTTP 5xx 저장 |
| 성능(UX) | Vercel Analytics + Sentry Web Vitals | 제품 KPI와 혼합 집계 |

사용자 식별·세션 연속성은 [frontend_event_instrumentation.md](./frontend_event_instrumentation.md)를 참조한다.

## 3. 관련 문서

- 스키마: [agent/common/schema.md](../common/schema.md) §3.3 EventLog
- Consumer 토픽·추천: [agent/backend/spec/backend_architecture_spec_consumer.md](../backend/spec/backend_architecture_spec_consumer.md) §2.2, §2.6
- 프론트 계측: [frontend_event_instrumentation.md](./frontend_event_instrumentation.md)
