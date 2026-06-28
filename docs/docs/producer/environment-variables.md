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

기본 포트는 **3000**입니다. 부팅 시 `server/producer/.../env.validation.ts`의 Joi 스키마로 **전 변수를 필수 검증**하며, 실패 시 프로세스가 종료됩니다.

`POSTGRESQL_URL`, `MONGODB_URL`, `REDIS_URL`, `KAFKA_BROKERS`는 [consumer 환경 변수](../consumer/environment-variables)와 **동일한 연결 정보**를 사용합니다. 호스트명만 환경에 맞게 바꿉니다.

## Docker Compose

### `DOCKERHUB_USERNAME`

| 항목 | 내용 |
| --- | --- |
| 설명 | Docker Hub 계정명. Compose `image` 필드 `${DOCKERHUB_USERNAME}/mealio-producer:latest` 치환에 사용 |
| 예시 | `your-dockerhub-username` |
| 사용처 | `docker/compose-producer.yml` `services.producer.image` |
| 패턴 | Compose가 `image` 태그를 해석하거나 Docker Hub에 Push |

### `MEMORY_LIMIT`

| 항목 | 내용 |
| --- | --- |
| 설명 | producer 컨테이너 메모리 limit (`deploy.resources.limits.memory`) |
| 예시 | `768M` |
| 사용처 | `docker/compose-producer.yml` |

## 공통

### `APP_ENV`

| 항목 | 내용 |
| --- | --- |
| 설명 | 런타임 환경 구분 |
| 허용 값 | `local`, `development`, `production`, `test` |
| 사용처 | Kafka 토픽 자동 생성 여부, Sentry 환경 태그 등 |

### `PORT`

| 항목 | 내용 |
| --- | --- |
| 설명 | HTTP API 및 `/metrics` 노출 포트 |
| 예시 | `3000` |
| 사용처 | `server/producer/.../main.ts` |

## 인증

### `JWT_SECRET`

| 항목 | 내용 |
| --- | --- |
| 설명 | Access Token 서명 비밀키 |
| 패턴 | 비어 있으면 안 됨 |
| 사용처 | `server/producer/.../auth.service.ts` |

### `OAUTH_CALLBACK_BASE_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | OAuth Provider에 등록하는 Redirect URI 베이스 (Producer 호스트) |
| 예시 | `http://localhost:3000` |
| 사용처 | Passport 전략·Provider 콜백 URL 조합 |

### `FRONTEND_APP_BASE_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | OAuth 성공·실패 후 리다이렉트 대상 (Next.js client) |
| 예시 | `http://localhost:4000` |
| 사용처 | `server/producer/.../auth.service.ts`, CORS `origin` (`main.ts`) |

OAuth 성공·실패 경로(`/oauth/callback`, `/oauth/error`)는 env가 아니라 `server/producer/.../auth.constants.ts` 상수로 정의됩니다.

### `*_CLIENT_ID` / `*_CLIENT_SECRET`

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET`
- `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET`

| 항목 | 내용 |
| --- | --- |
| 설명 | 소셜 로그인 Provider 자격 증명 |
| 패턴 | 비어 있으면 안 됨 |
| 사용처 | `server/producer/.../*.strategy.ts` |

→ [producer 인증](./auth)을 참고하세요.

## 데이터·메시징

### `POSTGRESQL_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | Prisma(RDB) 연결 문자열 |
| 사용처 | User, Recipe, Ingredient, 추천 원본 테이블 |

### `MONGODB_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | Mongoose(NoSQL) 연결 문자열 |
| 사용처 | Inventory, EventLog, ChatbotLog, ChatbotConversation |

### `REDIS_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | Cache-Aside, rate limit, refresh 세션 캐시 |
| 사용처 | `server/producer/.../cache/`, `rate-limit.middleware.ts` |

### `KAFKA_BROKERS` / `KAFKA_CLIENT_ID`

| 항목 | 내용 |
| --- | --- |
| 설명 | Kafka 브로커 목록·클라이언트 ID |
| 예시 | `localhost:9092`, `mealio-producer` |
| 사용처 | `server/producer/.../kafka/producer.service.ts` |

## 관측성

### `METRICS_ENABLED` / `METRICS_PORT`

| 항목 | 내용 |
| --- | --- |
| 설명 | Prometheus `/metrics` 노출 여부·전용 HTTP 포트 |
| 허용 값 | `METRICS_ENABLED`: `true`, `false`, `1`, `0` |
| 패턴 | `METRICS_ENABLED=true`일 때 `METRICS_PORT` 필수 (예: `9100`) |
| 사용처 | `server/producer/.../metrics-exporter.service.ts` |

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
