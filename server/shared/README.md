# Mealio Shared

Producer·Consumer 공용 패키지 (`@mealio/shared`)

![Prisma](https://img.shields.io/badge/Prisma-PostgreSQL-2D3748?logo=prisma&logoColor=white)
![MongoDB](https://img.shields.io/badge/Mongoose-MongoDB-47A248?logo=mongodb&logoColor=white)

## 소개

- Prisma(PostgreSQL)·Mongoose(MongoDB) 스키마·시드
- Redis, 공통 타입·상수·관측성 설정
- Producer·Consumer가 workspace 의존성으로 참조
- 모노레포 루트 [README.md](../../README.md)의 설치·인프라 절차를 먼저 따릅니다.

## 폴더 구조

```text
server/shared/
├─ src/
│  ├─ database/
│  │  ├─ prisma/       # schema, migrations, seed
│  │  └─ mongoose/     # schemas, seed
│  ├─ config/
│  └─ types/
└─ .env.example
```

## Configuration

Prisma·Mongoose CLI(마이그레이션·시드) 실행 시 사용합니다. 앱 런타임 env는 producer·consumer `.env.local`에 동일한 DB URL을 설정합니다.

```bash
cp .env.example .env.local
```

| 변수 | 설명 | 기본값(예시) |
| --- | --- | --- |
| `POSTGRESQL_URL` | PostgreSQL 연결 URL (Prisma) | `postgresql://devuser:devpassword@localhost:5432/devdb` |
| `MONGODB_URL` | MongoDB 연결 URL (Mongoose 시드) | `mongodb://devuser:devpassword@localhost:27017/devdb?authSource=admin` |

## 사용 방법

DB 작업은 모노레포 루트 스크립트를 사용합니다.

```bash
pnpm run db:prisma:generate
pnpm run db:prisma:migrate:dev
pnpm run db:mongoose:sync-indexes
pnpm run db:kafka:create-topics
pnpm run db:prisma:seed
pnpm run db:mongoose:seed
```

Kafka 토픽:

```bash
pnpm run db:kafka:create-topics:production
```

```bash
pnpm run build:shared
```
