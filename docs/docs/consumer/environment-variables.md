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

HTTP API 포트는 없습니다. 부팅 시 `server/consumer/.../env.validation.ts`의 Joi 스키마로 **모든 변수가 필수**인지 검증합니다.

`METRICS_ENABLED=true`이면 `METRICS_PORT`에서 별도로 `/metrics` 엔드포인트를 노출합니다.

## 공통

### `APP_ENV`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Consumer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 활성화 |
| 사용처 | `@mealio/shared` `sentry.config.ts` |

## 데이터·메시징

`POSTGRESQL_URL`, `MONGODB_URL`, `REDIS_URL`, `KAFKA_BROKERS`, `KAFKA_CLIENT_ID`는 [producer 환경 변수](../producer/environment-variables)와 **동일한 연결 정보**를 사용합니다. 호스트/Docker 호스트명만 환경에 맞게 바꿉니다.

| 변수 | consumer 전용 차이 |
| --- | --- |
| `KAFKA_CLIENT_ID` | 예: `mealio-consumer` (producer와 구분) |

### `POSTGRESQL_URL` / `MONGODB_URL` / `REDIS_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Consumer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 활성화 |
| 사용처 | `@mealio/shared` `sentry.config.ts` |

### `KAFKA_BROKERS` / `KAFKA_CLIENT_ID`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Consumer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 활성화 |
| 사용처 | `@mealio/shared` `sentry.config.ts` |

## OpenAI

### `OPENAI_API_KEY`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Consumer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 활성화 |
| 사용처 | `@mealio/shared` `sentry.config.ts` |

### `OPENAI_CHAT_MODEL`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Consumer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 활성화 |
| 사용처 | `@mealio/shared` `sentry.config.ts` |

### `OPENAI_EMBEDDING_MODEL`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Consumer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 활성화 |
| 사용처 | `@mealio/shared` `sentry.config.ts` |

### `OPENAI_BATCH_MODEL`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Consumer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 활성화 |
| 사용처 | `@mealio/shared` `sentry.config.ts` |

OpenAI 변수는 [챗봇](./chatbot)과 [레시피 수집](./recipe-ingestion) 문서에서 사용처를 확인할 수 있습니다.

## 공공데이터 (레시피 수집)

### `PUBLIC_DATA_API_KEY`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Consumer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 활성화 |
| 사용처 | `@mealio/shared` `sentry.config.ts` |

## 관측성

### `METRICS_ENABLED` / `METRICS_PORT`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Consumer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 활성화 |
| 사용처 | `@mealio/shared` `sentry.config.ts` |

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
