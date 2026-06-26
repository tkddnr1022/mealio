# 환경 변수

## 이 문서로 해결할 질문

- `@mealio/shared` CLI(마이그레이션·시드)에 필요한 env는 무엇인가요?
- producer·consumer 런타임 env와 어떻게 맞춰야 하나요?
- shared 패키지가 정의하는 관측성 env 검증 규칙은 어디서 쓰이나요?

## 개요

`@mealio/shared`는 독립 실행 앱이 아니며, **Prisma·Mongoose CLI**가 DB에 접속할 때 env를 읽습니다.

```bash
cp server/shared/.env.example server/shared/.env.local
```

`APP_ENV`는 루트 `package.json`의 `db:*` 스크립트에서 런타임 주입합니다. Prisma·Mongoose CLI는 `server/shared/.env.local`(local) 또는 `.env.{APP_ENV}.local` + `.env.local` fallback 순으로 env를 로드합니다.

런타임 DB 연결은 producer·consumer 각자의 `.env.local`에 동일한 URL을 설정합니다.

## 변수

### `POSTGRESQL_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | PostgreSQL 연결 URL (Prisma 마이그레이션·시드) |
| 예시 (호스트) | `postgresql://devuser:devpassword@localhost:5432/devdb` |
| 사용처 | `server/shared/.../schema.prisma`, `server/shared/.../seed.ts`, `PrismaModule`(producer·consumer 런타임) |
| 패턴 | [인프라 env](../project/infrastructure-environment-variables) `POSTGRES_*`와 자격 증명 일치 |

### `MONGODB_URL`

| 항목 | 내용 |
| --- | --- |
| 설명 | MongoDB 연결 URL (Mongoose 시드) |
| 예시 (호스트) | `mongodb://devuser:devpassword@localhost:27017/devdb?authSource=admin` |
| 사용처 | `server/shared/.../seed.ts`, `MongooseSchemasModule`(producer·consumer 런타임) |
| 패턴 | [인프라 env](../project/infrastructure-environment-variables) `MONGO_*`와 자격 증명 일치 |

## 사용 명령

```bash
pnpm run db:prisma:generate
pnpm run db:prisma:migrate:dev
pnpm run db:prisma:seed    # POSTGRESQL_URL
pnpm run db:mongoose:seed  # MONGODB_URL
pnpm run db:mongoose:sync-indexes  # MONGODB_URL — 스키마 인덱스 동기화
```

## 관측성 (런타임 — producer·consumer env)

shared 패키지가 정의하는 관측 env 검증 규칙은 producer·consumer `.env.local`에서 사용됩니다.

| 변수 | producer | consumer |
| --- | --- | --- |
| `METRICS_ENABLED` | ✓ (`PORT`에서 `/metrics`) | ✓ (`METRICS_PORT` 필수) |
| `PUSHGATEWAY_URL` | — | ✓ (optional, CLI batch push) |
| `SENTRY_ENABLED` | ✓ | ✓ |
| `SENTRY_DSN_PRODUCER` | ✓ | — |
| `SENTRY_DSN_CONSUMER` | — | ✓ |

상세 내용은 [producer 환경 변수](../producer/environment-variables) · [consumer 환경 변수](../consumer/environment-variables) · [Observability](../other/observability) 문서를 참고하세요.

## 관련 문서

- [환경 변수 준비](../project/getting-started#2-환경-변수-준비)
- [인프라 환경 변수](../project/infrastructure-environment-variables)
- [shared 개요](./overview)
- [데이터 모델](./data-models)
