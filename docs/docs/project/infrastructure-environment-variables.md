# 인프라 환경 변수

## 이 문서로 해결할 질문

- Docker Compose 인프라용 `.env.docker.local`에는 어떤 변수가 있나요?
- 각 변수는 어떤 Compose 파일에서 쓰이나요?
- 앱 패키지 env와 어떻게 맞춰야 하나요?

## 개요

루트 `.env.docker.local`은 **앱 패키지 env와 별도**이며, MongoDB·PostgreSQL·Redis·Kafka·Kafka UI·Prometheus·Grafana Compose 기동에 사용합니다.

```bash
cp .env.docker.example .env.docker.local

docker compose --env-file .env.docker.local -f docker/mongodb/compose.yml -f docker/postgres/compose.yml -f docker/redis/compose.yml -f docker/kafka/compose.yml -f docker/kafka-ui/compose.yml -f docker/pushgateway/compose.yml -f docker/prometheus/compose.yml -f docker/grafana/compose.yml up -d
```

앱 패키지의 `DATABASE_URL`·`MONGODB_URI`·`REDIS_URL`·`KAFKA_BROKERS`는 이 파일의 계정·호스트·포트와 **동일한 접속 정보**를 가리키도록 맞춥니다. 변수 준비 절차는 [로컬 개발/온보딩 — 환경 변수 준비](./getting-started#2-환경-변수-준비)를 참고하세요.

## MongoDB

`docker/mongodb/compose.yml`에서 root 계정을 설정합니다.

### `MONGO_ROOT_USERNAME` / `MONGO_ROOT_PASSWORD`

| 항목 | 내용 |
| --- | --- |
| 설명 | MongoDB root 사용자·비밀번호 |
| 예시 | `devuser` / `devpassword` |
| Compose | `docker/mongodb/compose.yml` |
| 앱 env 정합 | `MONGODB_URI`의 사용자·비밀번호와 일치 |

## PostgreSQL

`docker/postgres/compose.yml`에서 초기 DB·계정을 설정합니다.

### `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`

| 항목 | 내용 |
| --- | --- |
| 설명 | PostgreSQL 슈퍼유저·비밀번호·초기 데이터베이스명 |
| 예시 | `devuser` / `devpassword` / `devdb` |
| Compose | `docker/postgres/compose.yml` |
| 앱 env 정합 | `DATABASE_URL`의 user·password·database와 일치 |

Grafana PostgreSQL view는 `prisma migrate deploy`로 적용한다 (`20260628000000_add_grafana_readonly_views`).

## Redis

로컬 Redis는 `docker/redis/compose.yml`에서 **고정 포트 6379**로 기동하며, 앱의 `REDIS_URL`은 `redis://127.0.0.1:6379` 형식으로 맞춥니다.

## Kafka

`docker/kafka/compose.yml`에서 브로커 외부 리스너를 설정합니다.

### `KAFKA_EXTERNAL_HOST` / `KAFKA_EXTERNAL_PORT`

| 항목 | 내용 |
| --- | --- |
| 설명 | 호스트에서 Kafka에 접속할 때 사용하는 호스트명·포트 |
| 예시 | `localhost` / `9092` |
| Compose | `docker/kafka/compose.yml` |
| 앱 env 정합 | `KAFKA_BROKERS`는 `{KAFKA_EXTERNAL_HOST}:{KAFKA_EXTERNAL_PORT}`와 일치 |

## Kafka UI

개발 전용 UI이며 `docker/kafka-ui/compose.yml`에서 기동합니다.

### `KAFKA_UI_PORT` / `KAFKA_UI_CLUSTER_NAME` / `KAFKA_UI_BOOTSTRAP_SERVERS`

| 항목 | 내용 |
| --- | --- |
| 설명 | Kafka UI 호스트 포트·클러스터 표시명·브로커 부트스트랩 주소 |
| 예시 | `8080` / `mealio` / `kafka:19092` |
| Compose | `docker/kafka-ui/compose.yml` |
| 패턴 | `KAFKA_UI_BOOTSTRAP_SERVERS`는 Docker 네트워크 내부 주소(`kafka:19092`)를 사용 |

## Prometheus

`docker/prometheus/compose.yml`에서 스크랩 대상 모드를 선택합니다.

### `PROMETHEUS_TARGETS_MODE`

| 항목 | 내용 |
| --- | --- |
| 설명 | 메트릭 스크랩 대상 모드 |
| 값 | `host`(호스트에서 기동한 producer·consumer) 또는 `compose`(Compose로 기동한 앱 컨테이너) |
| 예시 (로컬) | `host` |
| 예시 (프로덕션) | `compose` |
| Compose | `docker/prometheus/compose.yml` |

### `PROMETHEUS_PORT` / `PROMETHEUS_PRODUCER_PORT` / `PROMETHEUS_CONSUMER_PORT`

| 항목 | 내용 |
| --- | --- |
| 설명 | Prometheus UI 포트·producer·consumer `/metrics` 포트 |
| 예시 | `9090` / `9100` / `9101` |
| Compose | `docker/prometheus/compose.yml` |
| 패턴 | `PROMETHEUS_TARGETS_MODE=host`일 때 producer·consumer는 호스트에서 해당 포트로 노출 |

### `PUSHGATEWAY_PORT`

| 항목 | 내용 |
| --- | --- |
| 설명 | Pushgateway 호스트 바인딩 포트 |
| 예시 | `9091` |
| Compose | `docker/pushgateway/compose.yml` |

## Grafana

`docker/grafana/compose.yml`에서 대시보드·알림을 설정합니다.

### `GRAFANA_PORT` / `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`

| 항목 | 내용 |
| --- | --- |
| 설명 | Grafana UI 포트·초기 관리자 계정 |
| 예시 | `3030` / `admin` / `admin` |
| Compose | `docker/grafana/compose.yml` |

### `GRAFANA_MONGODB_CONNECTION_SCHEME`

| 항목 | 내용 |
| --- | --- |
| 설명 | Grafana MongoDB 데이터소스 연결 스킴 |
| 허용 값 | `mongodb`(표준), `mongodb+srv`(Atlas 등 DNS seed list) |
| 예시 (로컬) | `mongodb` |
| 예시 (Atlas) | `mongodb+srv` |
| Compose | `docker/grafana/compose.yml` (미설정 시 `mongodb`) |
| 패턴 | `GRAFANA_MONGODB_HOST` 형식과 쌍으로 맞춤 — `mongodb`는 `host:port`, `mongodb+srv`는 호스트명만 |

### `GRAFANA_MONGODB_HOST` / `GRAFANA_MONGODB_USER` / `GRAFANA_MONGODB_PASSWORD` / `GRAFANA_MONGODB_DATABASE`

| 항목 | 내용 |
| --- | --- |
| 설명 | Grafana MongoDB 데이터소스 접속 정보 |
| 예시 (로컬) | `mongodb:27017` / `devuser` / `devpassword` / `devdb` |
| 예시 (Atlas) | `cluster0.xxxxx.mongodb.net` / Atlas 사용자 / 비밀번호 / DB명 |
| Compose | `docker/grafana/compose.yml` |
| 패턴 | Docker 네트워크 내부 호스트명(`mongodb`)과 `MONGO_*`·`POSTGRES_*` 계정과 일치. Atlas는 `GRAFANA_MONGODB_CONNECTION_SCHEME=mongodb+srv`와 함께 설정 |

### `GRAFANA_POSTGRES_HOST` / `GRAFANA_POSTGRES_USER` / `GRAFANA_POSTGRES_PASSWORD` / `GRAFANA_POSTGRES_DATABASE`

| 항목 | 내용 |
| --- | --- |
| 설명 | Grafana PostgreSQL 데이터소스 접속 정보 (도메인 SSOT 스냅샷) |
| 예시 | `postgres:5432` / `devuser` / `devpassword` / `devdb` |
| Compose | `docker/grafana/compose.yml` |
| 패턴 | `POSTGRES_*`·`POSTGRESQL_URL`과 자격 증명 일치 |

### `SLACK_OPS_WEBHOOK_URL` / `SLACK_PRODUCT_WEBHOOK_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | Grafana 알림용 Slack 웹훅 |
| 예시 (비활성) | `none` |
| Compose | `docker/grafana/compose.yml` |
| 패턴 | 실제 URL이 없으면 `none`으로 두어 provisioning 오류를 방지 |

## 컨테이너 메모리 limit

루트 `.env.docker.local`의 `*_MEMORY_LIMIT` 변수는 Compose `deploy.resources.limits.memory`에 매핑됩니다. 값은 Docker 단위(`512M`, `1G` 등)를 사용합니다.

| 변수 | 기본값(예시) | Compose |
| --- | --- | --- |
| `MONGODB_MEMORY_LIMIT` | `768M` | `docker/mongodb/compose.yml` |
| `POSTGRES_MEMORY_LIMIT` | `1G` | `docker/postgres/compose.yml` |
| `REDIS_MEMORY_LIMIT` | `256M` | `docker/redis/compose.yml` |
| `KAFKA_MEMORY_LIMIT` | `768M` | `docker/kafka/compose.yml` |
| `KAFKA_UI_MEMORY_LIMIT` | `512M` | `docker/kafka-ui/compose.yml` |
| `PUSHGATEWAY_MEMORY_LIMIT` | `128M` | `docker/pushgateway/compose.yml` |
| `PROMETHEUS_MEMORY_LIMIT` | `512M` | `docker/prometheus/compose.yml` |
| `GRAFANA_MEMORY_LIMIT` | `512M` | `docker/grafana/compose.yml` |

앱 컨테이너 limit은 각 패키지 `.env.docker.local`에서 관리합니다.

| 변수 | 패키지 env | 기본값(예시) | Compose |
| --- | --- | --- | --- |
| `MEMORY_LIMIT` | `server/producer/.env.docker.local` | `768M` | `docker/producer/compose.yml` |
| `MEMORY_LIMIT` | `server/consumer/.env.docker.local` | `1G` | `docker/consumer/compose.yml` |
| `MEMORY_LIMIT` | `client/.env.docker.local` | `512M` | `docker/client/compose.yml` |

## 관련 문서

- [로컬 개발/온보딩 — 환경 변수 준비](./getting-started#2-환경-변수-준비)
- [배포/환경 전략](./deployment)
- [Observability](../other/observability)
- [producer 환경 변수](../producer/environment-variables)
- [consumer 환경 변수](../consumer/environment-variables)
