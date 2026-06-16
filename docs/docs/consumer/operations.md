---
title: 운영/복구
---

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

메트릭 포트: `METRICS_PORT` (기본 9091)

## 주요 알림·대응

### Kafka lag 급증 (`ALERT_KAFKA_LAG`)

1. Grafana에서 topic·partition·group 확인
2. Consumer 로그: handler 오류·OpenAI 타임아웃
3. Consumer 인스턴스 재시작·스케일 (필요 시)
4. DLQ 적체 여부 확인

### DLQ 급증 (`ALERT_DLQ_SPIKE`)

1. DLQ 토픽 메시지 샘플링
2. `correlationId`로 원 요청 추적
3. 버그 수정 후 replay 또는 skip 정책

### 추천 반영 지연 (`ALERT_RECO_LATENCY`)

1. `user-events` lag 동반 여부
2. `RecommendationHandler` 트랜잭션 경합
3. `activity-events` warn 로그 (추천만 실패 가능)

→ [Observability](../other/observability), [Consumer 운영](../consumer/operations) §2.3

## Recipe Ingestion 복구

| 상황 | 조치 |
| --- | --- |
| `failed` job | `--retry-failed` CLI (정책 확정 후) |
| 수동 persist | `job:recipe-ingestion-persist --job-id <id>` |
| Batch expired | job `fetched` 복귀·재submit |

검증: `validation.md` §8-A

## 수동 명령

```bash
pnpm run start:consumer          # 상시 consumer
pnpm run kpi:rollup              # KPI 롤업
pnpm run recipe-ingestion:fetch  # ingestion 단계별
```

## 배포

- EC2: `docker/compose-consumer.yml`
- Kafka·DB 장애 시: Producer는 쓰기 이벤트 적체 → 복구 후 lag 소진 모니터링

## 관련 문서

- [Kafka 소비/신뢰성](./kafka-reliability)
- [배치/스케줄 작업](./batch-jobs)
- [Observability](../other/observability)

## 참고 코드·계약

- [Observability](../other/observability), [Consumer 운영](../consumer/operations)
- [Observability](../other/observability)
