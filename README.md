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
```

### Configuration

`.env.example`을 복사해 실제 환경 파일을 만듭니다.

```bash
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

프로젝트 루트 `.env.example`은 Docker Compose 인프라(DB, Kafka, 관측) 전용입니다. 앱 패키지별 환경 변수는 각 패키지 README를 참고하세요.

| 변수 | 설명 | 기본값(예시) |
| --- | --- | --- |
| `MONGO_ROOT_USERNAME` | MongoDB root 사용자명 | `devuser` |
| `MONGO_ROOT_PASSWORD` | MongoDB root 비밀번호 | `devpassword` |
| `POSTGRES_USER` | PostgreSQL 사용자명 | `devuser` |
| `POSTGRES_PASSWORD` | PostgreSQL 비밀번호 | `devpassword` |
| `POSTGRES_DB` | PostgreSQL 데이터베이스명 | `devdb` |
| `KAFKA_EXTERNAL_HOST` | 호스트에서 Kafka 접속 호스트 | `localhost` |
| `KAFKA_EXTERNAL_PORT` | 호스트에서 Kafka 접속 포트 | `9092` |
| `KAFKA_UI_PORT` | Kafka UI 포트 | `8080` |
| `KAFKA_UI_CLUSTER_NAME` | Kafka UI 클러스터 표시명 | `mealio` |
| `KAFKA_UI_BOOTSTRAP_SERVERS` | Kafka UI 부트스트랩 서버 | `kafka:19092` |
| `PROMETHEUS_TARGETS_MODE` | Prometheus 스크랩 대상 모드 (`host` / `docker`) | `host` |
| `PROMETHEUS_PORT` | Prometheus 포트 | `9090` |
| `PROMETHEUS_PRODUCER_PORT` | Producer 메트릭 스크랩 포트 | `3000` |
| `PROMETHEUS_CONSUMER_PORT` | Consumer 메트릭 스크랩 포트 | `9091` |
| `GRAFANA_PORT` | Grafana 포트 | `3030` |
| `GRAFANA_ADMIN_USER` | Grafana 관리자 사용자명 | `admin` |
| `GRAFANA_ADMIN_PASSWORD` | Grafana 관리자 비밀번호 | `admin` |
| `GRAFANA_MONGODB_HOST` | Grafana MongoDB 데이터소스 호스트 | `mongodb:27017` |
| `GRAFANA_MONGODB_USER` | Grafana MongoDB 사용자명 | `devuser` |
| `GRAFANA_MONGODB_PASSWORD` | Grafana MongoDB 비밀번호 | `devpassword` |
| `GRAFANA_MONGODB_DATABASE` | Grafana MongoDB 데이터베이스명 | `devdb` |
| `SLACK_OPS_WEBHOOK_URL` | 운영 Slack 웹훅 URL (`none`이면 비활성) | `none` |
| `SLACK_PRODUCT_WEBHOOK_URL` | 제품 Slack 웹훅 URL (`none`이면 비활성) | `none` |

| 패키지 | README |
| --- | --- |
| `client/` | [client/README.md](client/README.md) |
| `server/producer/` | [server/producer/README.md](server/producer/README.md) |
| `server/consumer/` | [server/consumer/README.md](server/consumer/README.md) |
| `server/shared/` | [server/shared/README.md](server/shared/README.md) |

## 사용 방법 (Usage)

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
