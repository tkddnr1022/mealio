# 인프라 환경 변수

## 이 문서로 해결할 질문

- Docker Compose 인프라용 `.env.docker.local`에는 어떤 변수가 있나요?
- 각 변수는 어떤 Compose 파일에서 쓰이나요?
- 앱 패키지 env와 어떻게 맞춰야 하나요?

## 개요

루트 `.env.docker.local`은 **앱 패키지 env와 별도**이며, MongoDB·PostgreSQL·Redis·Kafka·Kafka UI·Prometheus·Grafana Compose 기동에 사용합니다.

```bash
cp .env.docker.example .env.docker.local

docker compose --env-file .env.docker.local -f docker/compose-database.yml -f docker/compose-kafka.yml -f docker/compose-kafka-ui.yml -f docker/compose-monitoring.yml up -d
```

→ 패키지 간 정합성: [환경 변수](./getting-started#2-환경-변수-준비)

## MongoDB

### `MONGO_ROOT_USERNAME` / `MONGO_ROOT_PASSWORD`

| 항목 | 내용 |
| --- | --- |
| 설명 | MongoDB 컨테이너 root 계정 |
| 예시 | `devuser` / `devpassword` |
| 사용처 | `docker/compose-database.yml` → `MONGO_INITDB_ROOT_*` |
| 패턴 | 앱의 `MONGODB_URL` 사용자·비밀번호와 **동일**하게 맞춥니다 |

## PostgreSQL

### `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`

| 항목 | 내용 |
| --- | --- |
| 설명 | PostgreSQL 컨테이너 초기 계정·DB명 |
| 예시 | `devuser` / `devpassword` / `devdb` |
| 사용처 | `docker/compose-database.yml` |
| 패턴 | 앱의 `POSTGRESQL_URL` 연결 문자열과 **동일**하게 맞춥니다 |

## Kafka

### `KAFKA_EXTERNAL_HOST` / `KAFKA_EXTERNAL_PORT`

| 항목 | 내용 |
| --- | --- |
| 설명 | **호스트(개발 PC)** 에서 Kafka에 접속할 때 광고되는 주소 |
| 예시 (호스트 개발) | `localhost` / `9092` |
| 사용처 | `docker/compose-kafka.yml` → `KAFKA_ADVERTISED_LISTENERS` EXTERNAL 리스너 |
| 패턴 | producer·consumer `.env.local`의 `KAFKA_BROKERS`는 `localhost:9092` 형태로 이 값과 일치 |

### `KAFKA_UI_PORT` / `KAFKA_UI_CLUSTER_NAME` / `KAFKA_UI_BOOTSTRAP_SERVERS`

| 항목 | 내용 |
| --- | --- |
| 설명 | Kafka UI 웹 콘솔 설정 (개발 전용) |
| 예시 | `8080` / `mealio` / `kafka:19092` |
| 사용처 | `docker/compose-kafka-ui.yml` |
| 패턴 | `KAFKA_UI_BOOTSTRAP_SERVERS`는 **Compose 내부 네트워크** 주소(`kafka:19092`). 호스트 앱 env와 다릅니다 |

## Prometheus

### `PROMETHEUS_TARGETS_MODE`

| 항목 | 내용 |
| --- | --- |
| 설명 | 메트릭 스크랩 대상 모드 |
| 허용 값 | `host` — 호스트에서 실행 중인 producer·consumer / `compose` — 앱 Compose 컨테이너 |
| 예시 (호스트 개발) | `host` |
| 예시 (앱 Docker 배포) | `compose` |
| 사용처 | `docker/compose-monitoring.yml` entrypoint 스크립트 |

### `PROMETHEUS_PORT` / `PROMETHEUS_PRODUCER_PORT` / `PROMETHEUS_CONSUMER_PORT`

| 항목 | 내용 |
| --- | --- |
| 설명 | Prometheus UI 포트, producer·consumer 메트릭 스크랩 포트 |
| 예시 | `9090` / `3000` / `9091` |
| 패턴 | producer는 `PORT`와 동일(3000), consumer는 `METRICS_PORT`와 동일(9091) |

## Grafana

### `GRAFANA_PORT` / `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`

| 항목 | 내용 |
| --- | --- |
| 설명 | Grafana UI 포트·관리자 계정 |
| 예시 | `3030` / `admin` / `admin` |

### `GRAFANA_MONGODB_HOST` / `GRAFANA_MONGODB_USER` / `GRAFANA_MONGODB_PASSWORD` / `GRAFANA_MONGODB_DATABASE`

| 항목 | 내용 |
| --- | --- |
| 설명 | Grafana MongoDB 데이터소스 (EventLog·KPI 조회) |
| 예시 (Compose 내부) | `mongodb:27017` / `devuser` / `devpassword` / `devdb` |
| 패턴 | Compose 네트워크 호스트명 `mongodb` 사용. 호스트 앱의 `MONGODB_URL`과 자격 증명은 동일 |

### `SLACK_OPS_WEBHOOK_URL` / `SLACK_PRODUCT_WEBHOOK_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | Grafana 알림용 Slack 웹훅 |
| 예시 (비활성) | `none` |
| 패턴 | 실제 URL이 없으면 `none`으로 두어 provisioning 오류를 방지 |

## 관련 문서

- [환경 변수](./getting-started#2-환경-변수-준비)
- [배포/환경 전략](./deployment)
- [Observability](../other/observability)
- [producer 환경 변수](../producer/environment-variables)
- [consumer 환경 변수](../consumer/environment-variables)

## 참고 코드·계약

- `.env.docker.example`, 루트 `README.md`
- `docker/compose-database.yml`, `compose-kafka.yml`, `compose-kafka-ui.yml`, `compose-monitoring.yml`
