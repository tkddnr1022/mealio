# Mealio

AI 기반 맞춤형 레시피 추천 플랫폼

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933?logo=node.js&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-9.x-F69220?logo=pnpm&logoColor=white)
![Monorepo](https://img.shields.io/badge/Monorepo-pnpm-4A4A4A)
![Status](https://img.shields.io/badge/status-active-2ea44f)

## 소개 및 데모

- 보유 재료/관심 재료 기반 레시피 추천
- 레시피 검색 및 개인화 챗봇 지원
- Producer/Consumer 기반 이벤트 처리 구조
- 데모: 준비 중

## 폴더 및 파일 구조

```text
mealio/
├─ client/                 # Next.js 앱
├─ server/
│  ├─ producer/            # NestJS API 서버
│  ├─ consumer/            # Kafka Consumer 워커
│  └─ shared/              # 공용 모듈(Prisma/Mongoose/Redis/Types)
├─ docker/                 # Docker Compose 및 client/server Dockerfile
├─ agent/                  # 아키텍처/명세/가이드 문서
└─ README.md
```

## 설치 방법 (Prerequisites & Installation)

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker / Docker Compose

### Installation

```bash
git clone https://github.com/tkddnr1022/mealio.git
cd mealio

corepack enable
corepack prepare pnpm@latest --activate
pnpm install

# 인프라 Compose용 (DB·Kafka·관측)
cp .env.example .env.docker

# 호스트에서 앱 실행용
cp client/.env.example client/.env
cp server/producer/.env.example server/producer/.env
cp server/consumer/.env.example server/consumer/.env

# Docker Compose로 앱 기동용
cp client/.env.example client/.env.docker
cp server/producer/.env.example server/producer/.env.docker
cp server/consumer/.env.example server/consumer/.env.docker
```

## 사용 방법 (Usage)

환경 변수는 `.env.example`을 기준으로 설정합니다.

### Development

```bash
# 인프라 (DB/Kafka/Redis/Kafka UI/관측)
docker compose --env-file .env.docker -f docker/compose-database.yml -f docker/compose-kafka.yml -f docker/compose-kafka-ui.yml -f docker/compose-monitoring.yml up -d
```

```bash
pnpm run db:prisma:generate
pnpm run db:prisma:migrate:dev
pnpm run db:prisma:seed
pnpm run db:mongoose:seed
```

```bash
pnpm run start:producer
pnpm run start:consumer
pnpm run start:client
```

### Production

```bash
# 인프라 (DB/Kafka/Redis/Kafka UI/관측)
docker compose --env-file .env.docker -f docker/compose-database.yml -f docker/compose-kafka.yml -f docker/compose-kafka-ui.yml -f docker/compose-monitoring.yml up -d
```

```bash
pnpm run db:prisma:migrate:deploy
```

```bash
docker compose --env-file server/producer/.env.docker -f docker/compose-producer.yml up -d --build

docker compose --env-file server/consumer/.env.docker -f docker/compose-consumer.yml up -d --build

docker compose --env-file client/.env.docker -f docker/compose-client.yml up -d --build
```

## 기술 스택 (Tech Stack)

- Frontend: Next.js, TypeScript
- Backend: NestJS, Node.js
- Database: PostgreSQL(Prisma), MongoDB(Mongoose)
- Infra: Redis, Kafka, Docker Compose
- Observability: Sentry, Prometheus, Grafana
- AI: OpenAI API

## 기여 방법 (Contributing)

1. Issue 등록 또는 기존 Issue 확인
2. 브랜치 생성 (`feat/*`, `fix/*`, `chore/*`)
3. 변경 후 테스트 (`pnpm run ci`)
4. Pull Request 생성

## 라이선스 (License)

- License: MIT
