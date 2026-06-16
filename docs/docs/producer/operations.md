---
title: 운영 포인트
---

# 운영 포인트

## 이 문서로 해결할 질문

- Producer 장애 시 어디부터 확인하나요?
- 헬스·메트릭·로그 진입점은 어디인가요?

## 헬스 체크

| Endpoint | 용도 |
| --- | --- |
| `GET /health` | 프로세스 생존 |
| `GET /ready` | PostgreSQL·MongoDB·Redis 연결 |

`/ready` 실패 시 트래픽 라우팅 중단·롤백 검토.

## 메트릭 (Prometheus)

- Endpoint: `/metrics` (`METRICS_ENABLED=true`)
- 스크랩: `docker/compose-monitoring.yml` — `PROMETHEUS_PRODUCER_PORT` (기본 3000)

주요 지표: HTTP latency, Kafka produce 성공/실패, Redis·DB 연결.

## 로그·추적

- **Correlation-Id**: `X-Correlation-Id` 요청/응답 헤더
- 구조화 JSON 로그 — `@mealio/shared` structured-logger
- **Sentry**: `SENTRY_DSN_PRODUCER`

## 자주 보는 장애

| 증상 | 확인 |
| --- | --- |
| 401 급증 | refresh 세션·쿠키 도메인, OAuth callback URL |
| 429 급증 | rate limit 정책, Redis 연결 |
| API 느림 | Redis hit rate, Prisma slow query (`SLOW_QUERY_THRESHOLD_MS` policy, 기본 500ms) |
| Kafka 발행 실패 | broker 연결, 토픽 존재 여부 |

## 배포·환경

- EC2 Docker: `docker/compose-producer.yml`
- env: `server/producer/.env.docker`
- DB·Redis: Neon / Upstash URL (매니지드)

→ [배포/환경 전략](../project/deployment)

## 검증 시나리오

[Observability](../other/observability) §2~§4 — 헬스, Correlation-Id, Prometheus.

## 관련 문서

- [Observability](../other/observability)
- [Consumer 운영/복구](../consumer/operations)

## 참고 코드·계약

- [Observability](../other/observability)
- [배포](../project/deployment) · docker/
