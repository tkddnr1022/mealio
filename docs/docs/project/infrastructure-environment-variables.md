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
| 설명 | Grafana 알림용 Slack 웹훅 |
| 예시 (비활성) | `none` |
| 패턴 | 실제 URL이 없으면 `none`으로 두어 provisioning 오류를 방지 |

## PostgreSQL

### `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`

| 항목 | 내용 |
| --- | --- |
| 설명 | Grafana 알림용 Slack 웹훅 |
| 예시 (비활성) | `none` |
| 패턴 | 실제 URL이 없으면 `none`으로 두어 provisioning 오류를 방지 |

## Kafka

### `KAFKA_EXTERNAL_HOST` / `KAFKA_EXTERNAL_PORT`

| 항목 | 내용 |
| --- | --- |
| 설명 | Grafana 알림용 Slack 웹훅 |
| 예시 (비활성) | `none` |
| 패턴 | 실제 URL이 없으면 `none`으로 두어 provisioning 오류를 방지 |

### `KAFKA_UI_PORT` / `KAFKA_UI_CLUSTER_NAME` / `KAFKA_UI_BOOTSTRAP_SERVERS`

| 항목 | 내용 |
| --- | --- |
| 설명 | Grafana 알림용 Slack 웹훅 |
| 예시 (비활성) | `none` |
| 패턴 | 실제 URL이 없으면 `none`으로 두어 provisioning 오류를 방지 |

## Prometheus

### `PROMETHEUS_TARGETS_MODE`

| 항목 | 내용 |
| --- | --- |
| 설명 | Grafana 알림용 Slack 웹훅 |
| 예시 (비활성) | `none` |
| 패턴 | 실제 URL이 없으면 `none`으로 두어 provisioning 오류를 방지 |

### `PROMETHEUS_PORT` / `PROMETHEUS_PRODUCER_PORT` / `PROMETHEUS_CONSUMER_PORT`

| 항목 | 내용 |
| --- | --- |
| 설명 | Grafana 알림용 Slack 웹훅 |
| 예시 (비활성) | `none` |
| 패턴 | 실제 URL이 없으면 `none`으로 두어 provisioning 오류를 방지 |

## Grafana

### `GRAFANA_PORT` / `GRAFANA_ADMIN_USER` / `GRAFANA_ADMIN_PASSWORD`

| 항목 | 내용 |
| --- | --- |
| 설명 | Grafana 알림용 Slack 웹훅 |
| 예시 (비활성) | `none` |
| 패턴 | 실제 URL이 없으면 `none`으로 두어 provisioning 오류를 방지 |

### `GRAFANA_MONGODB_HOST` / `GRAFANA_MONGODB_USER` / `GRAFANA_MONGODB_PASSWORD` / `GRAFANA_MONGODB_DATABASE`

| 항목 | 내용 |
| --- | --- |
| 설명 | Grafana 알림용 Slack 웹훅 |
| 예시 (비활성) | `none` |
| 패턴 | 실제 URL이 없으면 `none`으로 두어 provisioning 오류를 방지 |

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
