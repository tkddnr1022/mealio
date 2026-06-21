# 환경 변수

## 이 문서로 해결할 질문

- Kafka Consumer에 필요한 환경 변수는 무엇인가요?
- OpenAI·공공데이터 API 키는 어디서 쓰이나요?
- producer와 공유하는 DB·Kafka 변수는 어떻게 맞추나요?

## 개요

Consumer 패키지는 Kafka Consumer와 배치 워커를 실행합니다. 환경 변수 파일은 호스트에서는 `server/consumer/.env.local`, Docker에서는 `server/consumer/.env.docker.local`을 사용합니다.

```bash
cp server/consumer/.env.example server/consumer/.env.local
```

부팅 시 `server/consumer/.../env.validation.ts`의 Joi 스키마로 **모든 변수가 필수**인지 검증합니다.

`METRICS_ENABLED=true`이면 `METRICS_PORT`에서 별도로 `/metrics` 엔드포인트를 노출합니다.

## 공통

### `APP_ENV`

| 항목 | 내용 |
| --- | --- |
| 설명 | 배포 환경 식별자 |
| 허용값 | `local`, `development`, `production`, `test` |
| 사용처 | `@mealio/shared` Sentry 초기화, 로그 컨텍스트 |

## 데이터·메시징

`POSTGRESQL_URL`, `MONGODB_URL`, `REDIS_URL`, `KAFKA_BROKERS`, `KAFKA_CLIENT_ID`는 [producer 환경 변수](../producer/environment-variables)와 **동일한 연결 정보**를 사용합니다. 호스트/Docker 호스트명만 환경에 맞게 바꿉니다.

| 변수 | consumer 전용 차이 |
| --- | --- |
| `KAFKA_CLIENT_ID` | 예: `mealio-consumer` (producer와 구분) |

### `POSTGRESQL_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | Prisma — Recipe·추천·크레딧·pgvector |
| 사용처 | `server/consumer/.../repositories/postgresql/` |

### `MONGODB_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | EventLog·ChatbotLog·ingestion job 문서 |
| 사용처 | Mongoose 스키마 모듈 |

### `REDIS_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | Handler 캐시·챗봇 스트림 이벤트 발행 |
| 사용처 | `@mealio/shared` Redis 모듈 |

### `KAFKA_BROKERS` / `KAFKA_CLIENT_ID`

| 항목 | 내용 |
| --- | --- |
| 설명 | Consumer 구독·내부 Producer(`cache-invalidation` 등) 브로커 연결 |
| 사용처 | `server/consumer/.../integrations/kafka/` |

## OpenAI

### `OPENAI_API_KEY`

| 항목 | 내용 |
| --- | --- |
| 설명 | GPT Chat Completions·Embedding·Batch API 인증 |
| 사용처 | `server/consumer/.../integrations/openai/` |

### `OPENAI_CHAT_MODEL`

| 항목 | 내용 |
| --- | --- |
| 설명 | 챗봇 Function Calling 모델 |
| 사용처 | `ProcessChatHandler` |

### `OPENAI_EMBEDDING_MODEL`

| 항목 | 내용 |
| --- | --- |
| 설명 | `search_recipes` 질의 임베딩 + recipe ingestion persist 시 RecipeEmbedding 업서트 |
| 사용처 | `integrations/openai/openai.service.ts`, `recipe-ingestion-persist/services/recipe-embedding-sync.service.ts` |

### `OPENAI_BATCH_MODEL`

| 항목 | 내용 |
| --- | --- |
| 설명 | recipe ingestion submit 배치 변환 |
| 사용처 | `recipe-ingestion-submit` job |

OpenAI 변수는 [챗봇](./chatbot)과 [레시피 수집](./recipe-ingestion) 문서에서 사용처를 확인할 수 있습니다.

## 공공데이터 (레시피 수집)

### `PUBLIC_DATA_API_KEY`

| 항목 | 내용 |
| --- | --- |
| 설명 | 식약처 조리식품 레시피 DB API 키 |
| 사용처 | `recipe-ingestion-fetch` job |

## 관측성

### `METRICS_ENABLED` / `METRICS_PORT`

| 항목 | 내용 |
| --- | --- |
| 설명 | Prometheus `/metrics` 노출 여부와 포트 |
| 패턴 | `METRICS_ENABLED=true`일 때 `METRICS_PORT` 필수 (예: `9091`) |
| 사용처 | `server/consumer/.../metrics-exporter.service.ts` |

### `SENTRY_ENABLED` / `SENTRY_DSN_CONSUMER`

| 항목 | 내용 |
| --- | --- |
| 설명 | Consumer 프로세스 Sentry 에러 리포팅 |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 활성화 |
| 사용처 | `@mealio/shared` `sentry.config.ts` |

## 관련 문서

- [환경 변수](../project/getting-started#2-환경-변수-준비)
- [배치 잡](./batch-jobs)
- [레시피 수집](./recipe-ingestion)
- [consumer 운영](./operations)
- [producer 환경 변수](../producer/environment-variables)
