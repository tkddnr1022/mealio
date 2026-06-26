# 배포/환경 전략

## 이 문서로 해결할 질문

- dev와 prod에서 컴포넌트는 어디에 올라가나요?
- Compose 파일 역할과 기동 순서는 무엇인가요?
- Mealio를 배포할 때 어떤 특성을 고려해야 하나요?

## 스택 구성

| 계층 | 컴포넌트 | 비고 |
| --- | --- | --- |
| 프론트엔드 | client (Next.js) | SSR·ISR — 서버 런타임 필요 |
| 백엔드 API | producer (NestJS) | HTTP API, OAuth, Kafka produce |
| 이벤트 워커 | consumer (NestJS) | Kafka consume, 배치 job |
| 메시지 브로커 | Kafka | 도메인 이벤트 버스 |
| 관계 DB | PostgreSQL | Prisma, pgvector 확장 |
| 문서 DB | MongoDB | Mongoose |
| 캐시 | Redis | Cache-Aside, 세션 |
| 관측성 | Prometheus, Grafana | 메트릭 수집·시각화 |

## 배포 시 고려 사항

### client (Next.js)

- SSR·ISR을 사용하므로 Node.js 서버 런타임이 필요합니다.
- `NEXT_PUBLIC_*` 변수는 **이미지 빌드 시** 번들에 인라이닝됩니다. 값이 바뀌면 재빌드가 필요합니다.
- `INTERNAL_API_BASE_URL`을 설정하면 SSR에서 내부 네트워크를 통해 producer를 호출할 수 있습니다.
- Docker 배포 시 `docker/compose-client.yml`과 `docker/Dockerfile.client`를 사용합니다.

### producer / consumer

- 각각 독립 프로세스·컨테이너로 운영합니다.
- 부팅 시 Joi 스키마로 모든 환경 변수를 검증하며, 실패 시 프로세스가 종료됩니다.
- Kafka 브로커가 준비된 뒤 기동해야 합니다.

### PostgreSQL (Prisma)

- `prisma migrate deploy`를 배포 파이프라인에 포함합니다.
- recipe ingestion은 pgvector 확장이 필요합니다.
- Connection pooler 사용을 권장합니다.

### Redis

- Cache-Aside, OAuth/세션에 사용합니다.
- TLS 연결을 지원합니다 (`rediss://`).

### Kafka

- producer·consumer 모두 동일 브로커에 연결합니다.
- `kafka-ui`는 개발 전용으로 프로덕션에는 배포하지 않습니다.

### Prometheus / Grafana / Pushgateway

- producer는 `PORT`와 동일 포트에서 `/metrics`를 노출합니다 (`METRICS_ENABLED=true`).
- consumer는 별도 `METRICS_PORT`에서 `/metrics`를 노출합니다.
- recipe-ingestion CLI batch job은 `PUSHGATEWAY_URL`로 Pushgateway에 메트릭을 push합니다.
- `PROMETHEUS_TARGETS_MODE`를 `host`(호스트 기동) 또는 `compose`(컨테이너 기동)로 구분합니다.

## 환경별 배치

### 프로덕션

| 컴포넌트 | 배포 방식 |
| --- | --- |
| client | `compose-client.yml` 또는 Vercel |
| producer | `compose-producer.yml` |
| consumer | `compose-consumer.yml` |
| Kafka | `compose-kafka.yml` |
| Prometheus/Grafana | `compose-monitoring.yml` |
| DB·Redis | 자체 호스팅 또는 관리형 서비스 |
| kafka-ui | **미배포** (개발 전용) |

### 개발 (로컬)

| 컴포넌트 | 위치 |
| --- | --- |
| producer, consumer, client | **호스트** (`pnpm run start:*`) |
| DB, Redis, Kafka, 관측 | **Docker Compose** |
| compose-producer/consumer/client | **미기동** |

→ [로컬 개발/온보딩](./getting-started)

## Compose 파일 (`docker/`)

| 파일 | 대상 | prod | dev |
| --- | --- | --- | --- |
| `compose-database.yml` | mongo, postgres, redis | ✗ | ✓ |
| `compose-kafka.yml` | kafka | ✓ | ✓ |
| `compose-kafka-ui.yml` | kafka-ui | ✗ | ✓ |
| `compose-monitoring.yml` | prometheus, grafana, pushgateway | ✓ | ✓ |
| `compose-producer.yml` | producer | ✓ | ✗ |
| `compose-consumer.yml` | consumer | ✓ | ✗ |
| `compose-client.yml` | client | 선택 | 선택 |

기동 순서는 **인프라 Compose를 먼저** 기동한 뒤 앱 Compose를 기동합니다. 모든 Compose 파일은 동일한 브리지 네트워크(`mealio-net`)를 공유합니다.

## 환경 변수 파일

| 파일 | 용도 |
| --- | --- |
| `.env.docker.local` | 인프라 Compose 전용 |
| `client/.env.local` | 호스트 client |
| `server/producer/.env.local` | 호스트 producer |
| `server/consumer/.env.local` | 호스트 consumer |
| `*.env.docker.local` | Docker로 앱 기동 시 |

변수별 사용처·예시·환경별 패턴은 [환경 변수](./getting-started#2-환경-변수-준비)와 패키지별 문서를 참고하세요.

## 릴리스 흐름 (요약)

1. CI가 통과해야 합니다 (`pnpm run ci`).
2. DB 마이그레이션을 적용합니다 (`db:prisma:migrate:deploy`).
3. 인프라 Compose(Kafka·관측)를 먼저 기동합니다.
4. producer·consumer 이미지를 빌드·기동합니다.
5. client를 배포합니다.
6. 헬스·메트릭·validation 시나리오를 확인합니다.

## 관련 문서

- [시스템 아키텍처](./architecture)
- [로컬 개발/온보딩](./getting-started)
- [인프라 환경 변수](./infrastructure-environment-variables)
- [Observability](../other/observability)
