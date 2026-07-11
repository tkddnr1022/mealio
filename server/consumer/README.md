# Mealio Consumer

Kafka Consumer 워커 (NestJS)

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![Kafka](https://img.shields.io/badge/Kafka-Consumer-231F20?logo=apachekafka&logoColor=white)

## 소개

- 챗봇 요청·백그라운드 이벤트 소비 및 LLM 처리
- 레시피 수집·KPI 롤업 등 배치 잡
- 모노레포 루트 [README.md](../../README.md)의 설치·인프라 절차를 먼저 따릅니다.

## 폴더 구조

```text
server/consumer/
├─ src/
│  ├─ consumers/        # Kafka 토픽 핸들러
│  ├─ jobs/             # 배치 잡 (KPI, 레시피 수집)
│  └─ config/           # 환경 변수 검증
├─ test/
├─ .env.example
└─ .env.docker.example
```

## Configuration

```bash
cp .env.example .env.local                    # 호스트 개발
cp .env.docker.example .env.docker.local      # Docker Compose
```

| 변수 | 설명 | 기본값(예시) |
| --- | --- | --- |
| `DOCKERHUB_USERNAME` | Compose `image` 태그 접두사 | `local` |
| `APP_ENV` | 실행 환경 (`package.json`/Compose에서 런타임 주입) | `local` |
| `POSTGRESQL_URL` | PostgreSQL 연결 URL | `postgresql://devuser:devpassword@localhost:5432/devdb` |
| `MONGODB_URL` | MongoDB 연결 URL | `mongodb://devuser:devpassword@localhost:27017/devdb?authSource=admin` |
| `REDIS_URL` | Redis 연결 URL | `redis://:devpassword@localhost:6379` |
| `KAFKA_CLIENT_ID` | Kafka 클라이언트 ID | `mealio-consumer` |
| `KAFKA_BROKERS` | Kafka 브로커 목록 | `localhost:9092` |
| `OPENAI_API_KEY` | OpenAI API 키 | `sk-...` |
| `OPENAI_CHAT_MODEL` | 챗봇 대화 모델 | `gpt-5.6-terra` |
| `OPENAI_EMBEDDING_MODEL` | 임베딩 모델 | `text-embedding-3-small` |
| `OPENAI_BATCH_MODEL` | 배치 처리 모델 | `gpt-5.6-terra` |
| `PUBLIC_DATA_API_KEY` | 공공데이터 API 키 (레시피 수집) | `your-public-data-api-key` |
| `SENTRY_ENABLED` | Sentry 활성화 | `false` |
| `SENTRY_DSN_CONSUMER` | Consumer Sentry DSN | (비움) |
| `METRICS_ENABLED` | Prometheus 메트릭 노출 | `true` |
| `METRICS_PORT` | 메트릭 HTTP 포트, `METRICS_ENABLED=true` 시 필수 | `9101` |
| `SLOW_QUERY_THRESHOLD_MS` | 슬로우 쿼리 임계값(ms), `METRICS_ENABLED=true` 시 필수 | `500` |
| `PUSHGATEWAY_URL` | recipe-ingestion CLI 메트릭 push URL (선택) | `http://localhost:9091` |

## 사용 방법

모노레포 루트에서 실행합니다.

```bash
pnpm run start:consumer
```

배치 잡 (루트 스크립트):

```bash
pnpm run kpi:rollup
pnpm run recipe-ingestion:fetch
pnpm run recipe-ingestion:parse-submit
pnpm run recipe-ingestion:parse-retrieve
pnpm run recipe-ingestion:embed-submit
pnpm run recipe-ingestion:embed-retrieve
```

```bash
pnpm run build:consumer
pnpm run ci:lint:consumer
pnpm run ci:test:consumer
```
