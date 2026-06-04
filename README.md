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
├─ docker/                 # Docker Compose 및 서버 Dockerfile
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
git clone <repo-url>
cd mealio

corepack enable
corepack prepare pnpm@latest --activate
pnpm install

cp .env.example .env
```

## 사용 방법 (Usage)

```bash
# 1) 인프라 기동 (DB/Kafka/Redis 등)
docker compose -f docker/compose-database.yml -f docker/compose-kafka.yml up -d

# 2) 서버(Producer/Consumer) 기동
docker compose -f docker/compose-app.yml up -d --build

# 3) 클라이언트 개발 서버
pnpm run start:client
```

```bash
# DB 작업
pnpm run db:prisma:generate
pnpm run db:prisma:migrate:dev
pnpm run db:prisma:seed
pnpm run db:mongoose:seed
```

```bash
# 자주 쓰는 실행 명령
pnpm run start:producer
pnpm run start:consumer
pnpm run ci
```

환경 변수는 `.env.example`을 기준으로 설정합니다.

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

## 라이선스 및 문의 (License)

- License: Private repository (All rights reserved)
- Contact: Issue 또는 PR 코멘트
