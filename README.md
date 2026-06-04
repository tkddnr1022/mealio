# Mealio — AI 기반 맞춤형 레시피 추천 서비스

## 개발 환경

- **Node.js**: 20+
- **패키지 매니저**: **pnpm**

### pnpm 설치

```bash
# Corepack 사용 (Node 16+)
corepack enable
corepack prepare pnpm@latest --activate

# 또는 https://pnpm.io/installation
```

### 설치 및 실행

```bash
# 루트에서 의존성 설치
pnpm install

# 서버 빌드 (shared → producer)
pnpm run build:server

# Producer 개발 서버
pnpm run start:producer
```

### 데이터베이스 (Prisma / Mongoose)

```bash
# Prisma Client 생성
pnpm run db:prisma:generate

# 개발: 마이그레이션 생성·적용 (POSTGRESQL_URL)
pnpm run db:prisma:migrate:dev

# 배포: 적용 대기 마이그레이션만 실행
pnpm run db:prisma:migrate:deploy

# PostgreSQL 시드
pnpm run db:prisma:seed

# MongoDB 시드 (MONGODB_URL)
pnpm run db:mongoose:seed
```

### 환경 변수

#### Client (`client/`)

| 변수 | 필수 | 기본값 | 설명 |
|------|:----:|--------|------|
| `NODE_ENV` | | `development` | 실행 환경 |
| `NEXT_PUBLIC_API_BASE_URL` | | `''` (same-origin) | API base URL |
| `NEXT_PUBLIC_API_PREFIX` | | `/api/v1` | REST API prefix |
| `NEXT_PUBLIC_SITE_URL` | | Vercel URL 또는 `http://localhost:3000` | metadataBase·OG 절대 URL |
| `NEXT_PUBLIC_SENTRY_DSN` | | — | Sentry DSN |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | | prod `0.1` / 그 외 `1` | Sentry traces 샘플 비율 (0–1) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | | — | GA4 Measurement ID |

#### Shared (`server/shared/`)

| 변수 | 필수 | 설명 |
|------|:----:|------|
| `POSTGRESQL_URL` | ✓ | PostgreSQL 연결 URL (Prisma CLI·`PrismaService`) |
| `MONGODB_URL` | ✓ | MongoDB 연결 URL (`MongooseSchemasModule`·시드) |
| `REDIS_URL` | ✓ | Redis 연결 URL (`createRedisConfig`) |
| `KAFKA_BROKERS` | ✓ | Kafka broker 목록(쉼표 구분) |
| `KAFKA_CLIENT_ID` | ✓ | Kafka client ID (`createKafkaConfig`) |
| `METRICS_ENABLED` | ✓ | `true`/`false`/`1`/`0` (관측·슬로우 쿼리 로깅) |
| `SENTRY_DSN` | | Sentry DSN |
| `SENTRY_RELEASE` | | Sentry release 식별자 |
| `NODE_ENV` | ✓ | Sentry `environment` 태그 |
| `SLOW_QUERY_THRESHOLD_MS` | ✓¹ | 슬로우 쿼리 임계(ms) |
| `LOG_SAMPLE_RATE` | ✓¹ | 로그 샘플 비율 (0–1) |
| `TRACE_SAMPLE_RATE` | ✓¹ | Sentry traces 샘플 비율 (0–1) |
| `METRICS_PORT` | ✓¹ | Consumer 전용 Prometheus `/metrics` 포트 |

¹ `METRICS_ENABLED=true`일 때 필수.

#### Producer (`server/producer/`)

| 변수 | 필수 | 설명 |
|------|:----:|------|
| `NODE_ENV` | ✓ | `development` \| `production` \| `test` |
| `PORT` | ✓ | HTTP 포트 |
| `JWT_SECRET` | ✓ | JWT 서명 시크릿 |
| `ACCESS_TOKEN_TTL_SEC` | ✓ | Access 토큰 TTL(초) |
| `REFRESH_TOKEN_TTL_SEC` | ✓ | Refresh 토큰 TTL(초) |
| `REFRESH_TOKEN_BYTES` | ✓ | Refresh 토큰 바이트 길이 |
| `POSTGRESQL_URL` | ✓ | PostgreSQL 연결 URL |
| `MONGODB_URL` | ✓ | MongoDB 연결 URL |
| `REDIS_URL` | ✓ | Redis 연결 URL |
| `KAFKA_BROKERS` | ✓ | Kafka broker 목록(쉼표 구분) |
| `KAFKA_CLIENT_ID` | ✓ | Kafka client ID |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | ✓ | Google OAuth |
| `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET` | ✓ | Kakao OAuth |
| `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` | ✓ | Naver OAuth |
| `OAUTH_CALLBACK_BASE_URL` | ✓ | OAuth 콜백 base URL |
| `FRONTEND_APP_BASE_URL` | ✓ | 프론트 base URL |
| `FRONTEND_OAUTH_ERROR_PATH` | ✓ | OAuth 실패 리다이렉트 경로 (예: `/oauth/error`) |
| `FRONTEND_OAUTH_DEFAULT_SUCCESS_PATH` | | OAuth 성공 기본 경로 (기본 `/recipe`) |
| `METRICS_ENABLED` | ✓ | `true`/`false`/`1`/`0` |
| `SENTRY_DSN` | | Sentry DSN |
| `SLOW_QUERY_THRESHOLD_MS` | ✓¹ | 슬로우 쿼리 임계(ms) |
| `LOG_SAMPLE_RATE` | ✓¹ | 로그 샘플 비율 (0–1) |
| `TRACE_SAMPLE_RATE` | ✓¹ | 트레이스 샘플 비율 (0–1) |

¹ `METRICS_ENABLED=true`일 때 필수.

#### Consumer (`server/consumer/`)

| 변수 | 필수 | 설명 |
|------|:----:|------|
| `NODE_ENV` | ✓ | `development` \| `production` \| `test` |
| `POSTGRESQL_URL` | ✓ | PostgreSQL 연결 URL |
| `MONGODB_URL` | ✓ | MongoDB 연결 URL |
| `REDIS_URL` | ✓ | Redis 연결 URL |
| `KAFKA_BROKERS` | ✓ | Kafka broker 목록 |
| `KAFKA_CLIENT_ID` | ✓ | Kafka client ID |
| `OPENAI_API_KEY` | ✓ | OpenAI API 키 |
| `OPENAI_CHAT_MODEL` | ✓ | 챗봇 모델 |
| `OPENAI_EMBEDDING_MODEL` | ✓ | 임베딩 모델 |
| `OPENAI_BATCH_MODEL` | ✓ | Batch API 모델 |
| `PUBLIC_DATA_API_KEY` | ✓ | 공공데이터 API 키 |
| `METRICS_ENABLED` | ✓ | `true`/`false`/`1`/`0` |
| `SENTRY_DSN` | | Sentry DSN |
| `METRICS_PORT` | ✓¹ | Prometheus `/metrics` 포트 |
| `SLOW_QUERY_THRESHOLD_MS` | ✓¹ | 슬로우 쿼리 임계(ms) |
| `LOG_SAMPLE_RATE` | ✓¹ | 로그 샘플 비율 (0–1) |
| `TRACE_SAMPLE_RATE` | ✓¹ | 트레이스 샘플 비율 (0–1) |

¹ `METRICS_ENABLED=true`일 때 필수.

### Vercel CI Secrets

| Secret | 용도 | 비고 |
|--------|------|------|
| `SENTRY_ORG` | Sentry 조직 slug | 소스맵 업로드 대상 |
| `SENTRY_PROJECT` | Sentry 프로젝트 slug | 소스맵 업로드 대상 |
| `SENTRY_AUTH_TOKEN` | Sentry Auth Token | `org:read`, `project:releases` 권한 필요 |

### 워크스페이스

| 경로 | 패키지명 | 설명 |
|------|----------|------|
| client | (Next.js) | 프론트엔드 |
| server/shared | @mealio/shared | Producer/Consumer 공용 (config, DB, Redis, types) |
| server/producer | @mealio/producer | NestJS API 서버 |
| server/consumer | @mealio/consumer | Kafka Consumer 워커 |
