# 운영/복구

## 이 문서로 해결할 질문

- Consumer lag·DLQ·추천 지연 장애 시 대응 절차는 무엇인가요?
- 수동 재처리·복구 명령은 무엇인가요?

## 모니터링 진입점

| 도구 | 확인 항목 |
| --- | --- |
| Grafana Ops | Kafka lag, fail rate, DLQ |
| Prometheus | `kafka_consumer_lag`, `kafka_messages_failed_total` |
| Sentry | `SENTRY_DSN_CONSUMER` |
| 로그 | `correlationId`, topic, partition |

메트릭은 `METRICS_PORT`(기본 9100)에서 수집합니다.

## 주요 알림·대응

### Kafka lag 급증 (`ALERT_KAFKA_LAG`)

1. Grafana에서 topic·partition·group을 확인합니다.
2. Consumer 로그에서 handler 오류·OpenAI 타임아웃을 점검합니다.
3. 필요 시 Consumer 인스턴스를 재시작하거나 스케일합니다.
4. DLQ 적체 여부를 확인합니다.

### DLQ 급증 (`ALERT_DLQ_SPIKE`)

1. DLQ 토픽 메시지를 샘플링합니다.
2. `correlationId`로 원 요청을 추적합니다.
3. 버그를 수정한 뒤 replay하거나 skip 정책을 적용합니다.

### 추천 반영 지연 (`ALERT_RECO_LATENCY`)

1. `user-events` lag 동반 여부를 확인합니다.
2. `RecommendationHandler` 트랜잭션 경합을 점검합니다.
3. `activity-events` warn 로그를 확인합니다(추천만 실패할 수 있음).

알림 임계치와 대응 절차는 [Observability](../other/observability)를 참고하세요.

## Recipe Ingestion 복구

| 상황 | 조치 |
| --- | --- |
| `failed` job | `--retry-failed` CLI (정책 확정 후) |
| 수동 persist | `job:recipe-ingestion-persist --job-id <id>` |
| Batch expired | job `fetched` 복귀·재submit |

검증 시나리오는 [레시피 수집 — 운영 검증](./recipe-ingestion#운영-검증)을 따릅니다.

## 수동 명령

```bash
pnpm run start:consumer          # 상시 consumer
pnpm run kpi:rollup              # KPI 롤업
pnpm run recipe-ingestion:fetch  # ingestion 단계별
```

## 배포

- EC2에서는 `docker/compose-consumer.yml`로 배포합니다.
- Kafka·DB 장애 시 Producer는 쓰기 이벤트가 적체되며, 복구 후 lag 소진을 모니터링해야 합니다.

## 관련 문서

- [Consumer 아키텍처](./architecture)
- [Kafka 소비/신뢰성](./kafka-reliability)
- [배치/스케줄 작업](./batch-jobs)
- [Observability](../other/observability)
