# 운영 포인트

## 이 문서로 해결할 질문

- Producer 장애 시 어디부터 확인하나요?
- 헬스·메트릭·로그 진입점은 어디인가요?

## 헬스 체크

| Endpoint | 용도 |
| --- | --- |
| `GET /health` | 프로세스 생존 |
| `GET /ready` | PostgreSQL·MongoDB·Redis 연결 |

`/ready`가 실패하면 트래픽 라우팅을 중단하고 롤백을 검토합니다.

## 메트릭 (Prometheus)

- Endpoint는 `/metrics`이며 `METRICS_ENABLED=true`일 때 노출됩니다.
- 스크랩은 `docker/compose-monitoring.yml`에서 수행하며, `PROMETHEUS_PRODUCER_PORT`(기본 3000)를 사용합니다.

주요 지표는 HTTP latency, Kafka produce 성공/실패, Redis·DB 연결 상태입니다.

## 로그·추적

- **Correlation-Id**: `X-Correlation-Id` 요청/응답 헤더로 전파됩니다.
- 구조화 JSON 로그는 `@mealio/shared` structured-logger를 사용합니다.
- **Sentry**는 `SENTRY_DSN_PRODUCER`로 연동합니다.

## 자주 보는 장애

| 증상 | 확인 |
| --- | --- |
| 401 급증 | refresh 세션·쿠키 도메인, OAuth callback URL |
| 429 급증 | rate limit 정책, Redis 연결 |
| API 느림 | Redis hit rate, Prisma slow query (`SLOW_QUERY_THRESHOLD_MS` policy, 기본 500ms) |
| Kafka 발행 실패 | broker 연결, 토픽 존재 여부 |

## 배포·환경

- Docker 배포 시 `docker/compose-producer.yml`을 사용합니다.
- 컨테이너 env는 `server/producer/.env.docker.local`을 사용합니다.
- `POSTGRESQL_URL`, `MONGODB_URL`, `REDIS_URL`은 각 환경에 맞는 연결 문자열로 설정합니다.

배포·환경 전략은 [배포/환경 전략](../project/deployment)을 참고하세요.

## 검증 시나리오

[Observability — 검증 (배포 후)](../other/observability#검증-배포-후)에서 헬스, Correlation-Id, Prometheus를 확인합니다.

## 관련 문서

- [아키텍처](./architecture)
- [환경 변수](./environment-variables)
- [Observability](../other/observability)
- [Consumer 운영/복구](../consumer/operations)
- [배포/환경 전략](../project/deployment)
