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

### 워크스페이스

| 경로 | 패키지명 | 설명 |
|------|----------|------|
| client | (Next.js) | 프론트엔드 |
| server/shared | @mealio/shared | Producer/Consumer 공용 (config, DB, Redis, types) |
| server/producer | @mealio/producer | NestJS API 서버 |
| server/consumer | @mealio/consumer | Kafka Consumer 워커 |
