# 환경 변수

## 이 문서로 해결할 질문

- Kafka Consumer에 필요한 환경 변수는 무엇인가요?
- OpenAI·공공데이터 API 키는 어디서 쓰이나요?
- producer와 공유하는 DB·Kafka 변수는 어떻게 맞추나요?

## 개요

Kafka Consumer·배치 워커. env 파일: `server/consumer/.env.local` (호스트) · `server/consumer/.env.docker.local` (Docker).

```bash
cp server/consumer/.env.example server/consumer/.env.local
```

HTTP API 포트 없음. 부팅 시 Joi로 **전 변수 필수** 검증 — `server/consumer/.../env.validation.ts`.

`METRICS_ENABLED=true` 시 **별도** `METRICS_PORT`에서 `/metrics` 노출.

## 공통

### `APP_ENV`

| 항목 | 내용 |
| --- | --- |
| 설명 | 실행 환경 식별 |
| 허용 값 | `local` · `development` · `production` · `test` |
| 예시 | `local` |
| 사용처 | Sentry environment, 샘플링 (`@mealio/shared` `sentry.config.ts`) |

## 데이터·메시징

`POSTGRESQL_URL`, `MONGODB_URL`, `REDIS_URL`, `KAFKA_BROKERS`, `KAFKA_CLIENT_ID`는 [producer 환경 변수](../producer/environment-variables)와 **동일한 연결 정보**를 사용합니다. 호스트/Docker 호스트명만 환경에 맞게 바꿉니다.

| 변수 | consumer 전용 차이 |
| --- | --- |
| `KAFKA_CLIENT_ID` | 예: `mealio-consumer` (producer와 구분) |

### `POSTGRESQL_URL` / `MONGODB_URL` / `REDIS_URL`

| 항목 | 내용 |
| --- | --- |
| 예시 (호스트) | `localhost` 호스트명 — producer와 동일 패턴 |
| 예시 (Docker) | `postgres`, `mongodb`, `redis` 서비스명 |
| 사용처 | `@mealio/shared` Prisma, Mongoose, Redis |

### `KAFKA_BROKERS` / `KAFKA_CLIENT_ID`

| 항목 | 내용 |
| --- | --- |
| `KAFKA_BROKERS` | 예: `localhost:9092` (호스트) · `kafka:19092` (Docker) |
| `KAFKA_CLIENT_ID` | 예: `mealio-consumer` |
| 사용처 | `@mealio/shared` `createKafkaConfig()`, Kafka consumer |

## OpenAI

### `OPENAI_API_KEY`

| 항목 | 내용 |
| --- | --- |
| 설명 | OpenAI API 인증 키 |
| 예시 | `sk-proj-...` (실제 키는 저장소에 커밋하지 않음) |
| 사용처 | `OpenAIService`, `OpenAIBatchService` 생성자 |

### `OPENAI_CHAT_MODEL`

| 항목 | 내용 |
| --- | --- |
| 설명 | 챗봇 대화·도구 호출 모델 |
| 예시 | `gpt-4.1-mini` |
| 사용처 | `server/consumer/.../openai.service.ts` |

### `OPENAI_EMBEDDING_MODEL`

| 항목 | 내용 |
| --- | --- |
| 설명 | 레시피·재료 임베딩 모델 |
| 예시 | `text-embedding-3-small` |
| 사용처 | `OpenAIService.createEmbedding(s)` |

### `OPENAI_BATCH_MODEL`

| 항목 | 내용 |
| --- | --- |
| 설명 | OpenAI Batch API 레시피 ETL 모델 |
| 예시 | `gpt-4.1-mini` |
| 사용처 | `server/consumer/.../openai-batch.service.ts` |
| 패턴 | `recipe-ingestion:submit` · `retrieve` 배치 잡 |

→ [챗봇](./chatbot) · [레시피 수집](./recipe-ingestion)

## 공공데이터 (레시피 수집)

### `PUBLIC_DATA_API_KEY`

| 항목 | 내용 |
| --- | --- |
| 설명 | 식품의약품안전처 조리식품 레시피 Open API 인증키 |
| 발급 | [식품안전나라 Open API](https://www.foodsafetykorea.go.kr/apiMain.do) |
| 예시 | `your-public-data-api-key` |
| 사용처 | `server/consumer/.../public-data-api.client.ts` |
| 패턴 | `recipe-ingestion:fetch` 잡. URL path에 키 삽입 |

## 관측성

### `METRICS_ENABLED` / `METRICS_PORT`

| 항목 | 내용 |
| --- | --- |
| `METRICS_ENABLED` | `true` / `false` / `1` / `0` — producer와 동일 의미 |
| `METRICS_PORT` | `METRICS_ENABLED=true`일 때 **필수**. 예: `9091` |
| 사용처 | Consumer 메트릭 HTTP 서버, `docker/compose-consumer.yml` healthcheck |
| 패턴 | producer와 포트 충돌 방지를 위해 3000이 아닌 별도 포트 사용 |

### `SENTRY_ENABLED` / `SENTRY_DSN_CONSUMER`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Consumer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 활성화 |
| 사용처 | `@mealio/shared` `sentry.config.ts` |

## 관련 문서

- [환경 변수](../project/getting-started#2-환경-변수-준비)
- [배치 잡](./batch-jobs)
- [레시피 수집](./recipe-ingestion)
- [consumer 운영](./operations)
- [producer 환경 변수](../producer/environment-variables)
