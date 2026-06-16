# 환경 변수

## 이 문서로 해결할 질문

- `@mealio/shared` CLI(마이그레이션·시드)에 필요한 env는 무엇인가요?
- producer·consumer 런타임 env와 어떻게 맞춰야 하나요?

## 개요

`@mealio/shared`는 독립 실행 앱이 아니며, **Prisma·Mongoose CLI** 가 DB에 접속할 때 env를 읽습니다.

```bash
cp server/shared/.env.example server/shared/.env.local
```

`APP_ENV`는 루트 `package.json`의 `db:*` 스크립트에서 런타임 주입합니다. Prisma·Mongoose CLI는 `server/shared/.env.local`(local) 또는 `.env.{APP_ENV}.local` + `.env.local` fallback 순으로 env를 로드합니다.

런타임 DB 연결은 producer·consumer 각자의 `.env.local`에 동일한 URL을 설정합니다.

## 변수

### `POSTGRESQL_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | PostgreSQL 연결 URL (Prisma) |
| 예시 (호스트) | `postgresql://devuser:devpassword@localhost:5432/devdb` |
| 예시 (Docker 인프라) | `postgresql://devuser:devpassword@localhost:5432/devdb` (호스트에서 CLI 실행 시) |
| 사용처 | `server/shared/src/database/prisma/seed.ts`, Prisma schema, `PrismaService`(producer·consumer 런타임) |
| 패턴 | producer·consumer `.env.local`과 **동일한 DB**를 가리켜야 시드·앱 데이터가 일치 |

### `MONGODB_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | MongoDB 연결 URL (Mongoose 시드) |
| 예시 (호스트) | `mongodb://devuser:devpassword@localhost:27017/devdb?authSource=admin` |
| 사용처 | `server/shared/src/database/mongoose/seed.ts`, `MongooseModule`(producer·consumer 런타임) |
| 패턴 | [인프라 env](../project/infrastructure-environment-variables) `MONGO_*`와 자격 증명 일치 |

## 사용 명령

```bash
pnpm run db:prisma:generate
pnpm run db:prisma:migrate:dev
pnpm run db:prisma:seed    # POSTGRESQL_URL
pnpm run db:mongoose:seed  # MONGODB_URL
```

## 관측성 (런타임 — producer·consumer env)

shared 패키지가 정의하는 관측 env 검증 규칙은 producer·consumer `.env.local`에서 사용됩니다.

| 변수 | producer | consumer |
| --- | --- | --- |
| `METRICS_ENABLED` | ✓ (`PORT`에서 `/metrics`) | ✓ (`METRICS_PORT` 필수) |
| `SENTRY_ENABLED` | ✓ | ✓ |
| `SENTRY_DSN_PRODUCER` | ✓ | — |
| `SENTRY_DSN_CONSUMER` | — | ✓ |

→ [producer 환경 변수](../producer/environment-variables) · [consumer 환경 변수](../consumer/environment-variables) · [Observability](../other/observability)

## 관련 문서

- [환경 변수 허브](../project/environment-variables)
- [shared 개요](./overview)
- [데이터 모델](./data-models)

## 참고 코드·계약

- `server/shared/.env.example`, `server/shared/README.md`
- `server/shared/prisma.config.ts`, `server/shared/src/config/load-env-files.ts`
- `server/shared/src/database/prisma/seed.ts`
- `server/shared/src/database/mongoose/seed.ts`
- `server/shared/src/config/observability.env-validation.ts`
