# 환경 변수

## 이 문서로 해결할 질문

- NestJS producer에 필요한 환경 변수는 무엇인가요?
- OAuth·JWT·DB·Kafka 변수는 어디서 검증·사용되나요?
- client·인프라 env와 어떻게 맞춰야 하나요?

## 개요

NestJS REST API. env 파일: `server/producer/.env` (호스트) · `server/producer/.env.docker` (Docker).

```bash
cp server/producer/.env.example server/producer/.env
```

기본 포트 **3000**. 부팅 시 Joi로 **전 변수 필수** 검증 — `server/producer/src/config/env.validation.ts`, 실패 시 프로세스 종료.

## 공통

### `APP_ENV` / `PORT`

| 항목 | 내용 |
| --- | --- |
| `APP_ENV` | `development` · `production` · `test` — Sentry environment, 샘플링 |
| `PORT` | HTTP listen 포트. 예: `3000`. `server/producer/src/main.ts`에서 `parseInt` 후 listen |
| Docker | `compose-producer.yml`이 `127.0.0.1:${PORT}` 바인딩 |

## 인증

### `JWT_SECRET`

| 항목 | 내용 |
| --- | --- |
| 설명 | Access JWT 서명 시크릿 |
| 예시 | 256비트 이상 랜덤 문자열 |
| 사용처 | `server/producer/src/modules/auth/auth.module.ts` — `JwtModule.registerAsync` |
| 패턴 | 프로덕션에서는 반드시 강한 시크릿으로 교체 |

### `OAUTH_CALLBACK_BASE_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | OAuth Provider에 등록하는 콜백 **base** (Producer 공개 URL) |
| 예시 (로컬) | `http://localhost:3000` |
| 예시 (Docker) | `http://127.0.0.1:3000` |
| 사용처 | `GoogleStrategy`, `KakaoStrategy`, `NaverStrategy` — `{base}/api/v1/auth/{provider}/callback` |
| 패턴 | trailing slash 제거 후 조합. Provider 콘솔 Redirect URI와 **정확히 일치**해야 함 |

### `FRONTEND_APP_BASE_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | 로그인 성공·실패 후 리다이렉트 대상 (Client URL) |
| 예시 | `http://localhost:4000` |
| 사용처 | `server/producer/src/main.ts` CORS `origin`, `AuthService` 리다이렉트 URL |
| 패턴 | URI 검증(Joi `.uri()`). Client origin과 일치 |

### `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

### `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET`

### `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET`

| 항목 | 내용 |
| --- | --- |
| 설명 | 각 OAuth Provider 앱 자격 증명 |
| 예시 | Google: `xxx.apps.googleusercontent.com` / `example-secret` |
| 사용처 | 각 Passport Strategy `clientID` / `clientSecret` |
| 패턴 | 개발용 placeholder라도 **비어 있으면 부팅 실패**. 미사용 Provider도 현재 스키마상 필수 |

→ [producer 인증](./auth) · [client 환경 변수](../client/environment-variables)

## 데이터·메시징

### `POSTGRESQL_URL`

| 항목 | 내용 |
| --- | --- |
| 예시 (호스트) | `postgresql://devuser:devpassword@localhost:5432/devdb` |
| 예시 (Docker) | `postgresql://devuser:devpassword@postgres:5432/devdb` |
| 사용처 | `@mealio/shared` `PrismaService` |
| 패턴 | [인프라 env](../project/infrastructure-environment-variables) `POSTGRES_*`와 자격 증명 일치 |

### `MONGODB_URL`

| 항목 | 내용 |
| --- | --- |
| 예시 (호스트) | `mongodb://devuser:devpassword@localhost:27017/devdb?authSource=admin` |
| 예시 (Docker) | `mongodb://devuser:devpassword@mongodb:27017/devdb?authSource=admin` |
| 사용처 | `@mealio/shared` `MongooseModule` |

### `REDIS_URL`

| 항목 | 내용 |
| --- | --- |
| 예시 (호스트) | `redis://localhost:6379` |
| 예시 (Docker) | `redis://redis:6379` |
| 사용처 | `@mealio/shared` `createRedisConfig()` — OAuth state, refresh 세션 캐시 등 |

### `KAFKA_BROKERS` / `KAFKA_CLIENT_ID`

| 항목 | 내용 |
| --- | --- |
| `KAFKA_BROKERS` | 쉼표 구분 브로커 목록. 예: `localhost:9092` 또는 `kafka:19092` |
| `KAFKA_CLIENT_ID` | 예: `mealio-producer`. admin·producer suffix 붙음 (`mealio-producer-admin`) |
| 사용처 | `@mealio/shared` `createKafkaConfig()`, `KafkaProducerService` |
| 패턴 | 호스트 개발 시 [인프라 env](../project/infrastructure-environment-variables) `KAFKA_EXTERNAL_*`와 일치 |

## 관측성

### `METRICS_ENABLED`

| 항목 | 내용 |
| --- | --- |
| 허용 값 | `true` / `false` / `1` / `0` |
| 예시 | `true` |
| 사용처 | `@mealio/shared` `createObservabilityConfig('producer')` |
| 패턴 | `true`이면 HTTP `PORT`에서 `/metrics` 노출 (별도 `METRICS_PORT` 없음) |

### `SENTRY_ENABLED` / `SENTRY_DSN_PRODUCER`

| 항목 | 내용 |
| --- | --- |
| 설명 | Sentry 활성화·Producer DSN |
| 패턴 | `SENTRY_ENABLED=true` **이고** DSN이 있을 때만 `initSentry` 활성화 |
| 사용처 | `server/producer/src/main.ts`, `@mealio/shared` `sentry.config.ts` |

## 관련 문서

- [환경 변수 허브](../project/environment-variables)
- [producer 인증](./auth)
- [producer 운영](./operations)
- [Observability](../other/observability)
- [shared 환경 변수](../shared/environment-variables)

## 참고 코드·계약

- `server/producer/.env.example`, `server/producer/.env.docker.example`, `server/producer/README.md`
- `server/producer/src/config/env.validation.ts`
- `server/shared/src/config/observability.env-validation.ts`
- `docker/compose-producer.yml`
