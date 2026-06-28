# Mealio Producer

NestJS 기반 REST API 서버 (Producer)

![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)

## 소개

- 인증(OAuth), 레시피·재료·재고 API, 챗봇 SSE 진입점
- Kafka 이벤트 발행, Redis 캐시, Prisma(PostgreSQL)·Mongoose(MongoDB)
- 모노레포 루트 [README.md](../../README.md)의 설치·인프라 절차를 먼저 따릅니다.

## 폴더 구조

```text
server/producer/
├─ src/
│  ├─ modules/          # 도메인 모듈
│  ├─ infrastructure/   # Kafka, Redis 등
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
| `PORT` | HTTP 서버 포트 | `3000` |
| `JWT_SECRET` | JWT 서명 시크릿 (256비트 이상 권장) | `a-string-secret-at-least-256-bits-long` |
| `POSTGRESQL_URL` | PostgreSQL 연결 URL | `postgresql://devuser:devpassword@localhost:5432/devdb` |
| `MONGODB_URL` | MongoDB 연결 URL | `mongodb://devuser:devpassword@localhost:27017/devdb?authSource=admin` |
| `REDIS_URL` | Redis 연결 URL | `redis://localhost:6379` |
| `KAFKA_BROKERS` | Kafka 브로커 목록 | `localhost:9092` |
| `KAFKA_CLIENT_ID` | Kafka 클라이언트 ID | `mealio-producer` |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID | `example.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 시크릿 | `example-secret` |
| `KAKAO_CLIENT_ID` | Kakao OAuth REST API 키 | `example-client-id` |
| `KAKAO_CLIENT_SECRET` | Kakao OAuth 시크릿 | `example-client-secret` |
| `NAVER_CLIENT_ID` | Naver OAuth 클라이언트 ID | `example-client-id` |
| `NAVER_CLIENT_SECRET` | Naver OAuth 시크릿 | `example-client-secret` |
| `OAUTH_CALLBACK_BASE_URL` | OAuth 콜백 base URL (Producer) | `http://localhost:3000` |
| `FRONTEND_APP_BASE_URL` | 로그인 후 리다이렉트 대상 (Client) | `http://localhost:4000` |
| `SENTRY_ENABLED` | Sentry 활성화 | `false` |
| `SENTRY_DSN_PRODUCER` | Producer Sentry DSN | (비움) |
| `METRICS_ENABLED` | Prometheus 메트릭 노출 | `true` |
| `METRICS_PORT` | 메트릭 HTTP 포트, `METRICS_ENABLED=true` 시 필수 | `9100` |
| `SLOW_QUERY_THRESHOLD_MS` | 슬로우 쿼리 임계값(ms), `METRICS_ENABLED=true` 시 필수 | `500` |

## 사용 방법

모노레포 루트에서 실행합니다.

```bash
pnpm run start:producer
```

```bash
pnpm run build:producer
pnpm run ci:lint:producer
pnpm run ci:test:producer
```

기본 접속: `http://localhost:3000` (Swagger: `/api/docs`)
