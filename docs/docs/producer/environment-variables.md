# 환경 변수

## 이 문서로 해결할 질문

- NestJS producer에 필요한 환경 변수는 무엇인가요?
- OAuth·JWT·DB·Kafka 변수는 어디서 검증·사용되나요?
- client·인프라 env와 어떻게 맞춰야 하나요?

## 개요

Producer는 NestJS REST API이며, env 파일은 호스트용 `server/producer/.env.local`, Docker용 `server/producer/.env.docker.local`을 사용합니다.

```bash
cp server/producer/.env.example server/producer/.env.local
```

기본 포트는 **3000**입니다. 부팅 시 Joi로 **전 변수를 필수 검증**하며(`server/producer/.../env.validation.ts`), 실패 시 프로세스가 종료됩니다.

## 공통

### `APP_ENV` / `PORT`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Producer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 `initSentry` 활성화 |
| 사용처 | `server/producer/.../main.ts`, `@mealio/shared` `sentry.config.ts` |

## 인증

### `JWT_SECRET`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Producer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 `initSentry` 활성화 |
| 사용처 | `server/producer/.../main.ts`, `@mealio/shared` `sentry.config.ts` |

### `OAUTH_CALLBACK_BASE_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Producer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 `initSentry` 활성화 |
| 사용처 | `server/producer/.../main.ts`, `@mealio/shared` `sentry.config.ts` |

### `FRONTEND_APP_BASE_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Producer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 `initSentry` 활성화 |
| 사용처 | `server/producer/.../main.ts`, `@mealio/shared` `sentry.config.ts` |

### `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

### `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET`

### `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Producer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 `initSentry` 활성화 |
| 사용처 | `server/producer/.../main.ts`, `@mealio/shared` `sentry.config.ts` |

→ [producer 인증](./auth) · [client 환경 변수](../client/environment-variables)를 참고하세요.

## 데이터·메시징

### `POSTGRESQL_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Producer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 `initSentry` 활성화 |
| 사용처 | `server/producer/.../main.ts`, `@mealio/shared` `sentry.config.ts` |

### `MONGODB_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Producer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 `initSentry` 활성화 |
| 사용처 | `server/producer/.../main.ts`, `@mealio/shared` `sentry.config.ts` |

### `REDIS_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Producer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 `initSentry` 활성화 |
| 사용처 | `server/producer/.../main.ts`, `@mealio/shared` `sentry.config.ts` |

### `KAFKA_BROKERS` / `KAFKA_CLIENT_ID`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Producer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 `initSentry` 활성화 |
| 사용처 | `server/producer/.../main.ts`, `@mealio/shared` `sentry.config.ts` |

## 관측성

### `METRICS_ENABLED`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Producer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 `initSentry` 활성화 |
| 사용처 | `server/producer/.../main.ts`, `@mealio/shared` `sentry.config.ts` |

### `SENTRY_ENABLED` / `SENTRY_DSN_PRODUCER`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Producer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 `initSentry` 활성화 |
| 사용처 | `server/producer/.../main.ts`, `@mealio/shared` `sentry.config.ts` |

## 관련 문서

- [환경 변수](../project/getting-started#2-환경-변수-준비)
- [producer 인증](./auth)
- [producer 운영](./operations)
- [Observability](../other/observability)
- [shared 환경 변수](../shared/environment-variables)
