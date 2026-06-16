---
title: Observability
---

# Observability

## 이 문서로 해결할 질문

- Mealio 관측성 스택 구성은?
- 로그·메트릭·이벤트·KPI 문서는 어디에 있는가?
- 배포 후 검증은 어떻게 하는가?

## 스택 개요

```text
[Client]  GA4, Web Vitals, Sentry
[Producer] Prometheus /metrics, Sentry, Correlation-Id 로그
[Consumer] Prometheus /metrics, Sentry, EventLog 기록
[Infra]   Prometheus → Grafana (Ops + Product 대시보드)
[Data]    MongoDB event_logs → KPI rollup → kpi_rollups
```

## 문서 맵 (`agent/observability/`)

| 문서 | 용도 |
| --- | --- |
| `validation.md` | 통합 수동 검증 시나리오 |
| `event_dictionary.md` | GA ↔ EventLog ↔ Kafka 매핑 |
| `product_kpi_contract.md` | KPI ID·계산식 SSOT |
| `aggregation_pipeline.md` | EventLog → 롤업 → 대시보드 |
| `product_kpi_runbook.md` | 알림·장애 대응 |
| `frontend_event_instrumentation.md` | GA4 계측 체크리스트 |

## 핵심 KPI (요약)

| KPI | 설명 |
| --- | --- |
| `kpi_recipe_favorite_cvr` | 조회 → 관심 전환율 |
| `kpi_recommendation_e2e_latency` | favorites_add → 추천 반영 지연 |
| `kpi_kafka_fail_rate` | Kafka 처리 실패율 |
| `kpi_kafka_lag_p95` | Consumer lag |
| `kpi_chatbot_dau_messages` | 챗봇 DAU 메시지 |

## Correlation-Id

클라이언트 → Producer → Kafka → Consumer 전 구간 추적.

- 헤더: `X-Correlation-Id`
- 구조화 로그 필드: `correlationId`

## Grafana

- Provisioning: `observability/grafana/`
- Ops 대시보드: `mealio-ops.json`
- 알림: `alerting/rules.yml` — Slack #ops / #product

로컬: Grafana `:3030` (compose-monitoring)

## 검증 (배포 후)

`validation.md` 체크리스트:

1. `/health`, `/ready`
2. Correlation-Id 전파
3. Prometheus 스크랩
4. Sentry 테스트 이벤트
5. GA4 page_view
6. EventLog 파이프라인
7. KPI 롤업 job

## 관련 문서

- [이벤트/분석 파이프라인](../consumer/analytics-pipeline)
- [Producer 운영](../producer/operations)
- [Consumer 운영/복구](../consumer/operations)

## SSOT

- `agent/observability/validation.md`
- `agent/observability/event_dictionary.md`
