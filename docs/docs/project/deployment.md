---
title: 배포/환경 전략
sidebar_position: 9
---

# 배포/환경 전략

## 이 문서로 해결할 질문

- dev와 prod에서 컴포넌트는 어디에 올라가는가?
- 프론트엔드 배포 옵션(Vercel vs EC2)은?
- Compose 파일 역할과 기동 순서는?

## 확정 스택 (MVP·초기 프로덕션)

| 계층 | 플랫폼 | 컴포넌트 |
| --- | --- | --- |
| 프론트엔드 | **Vercel** 또는 **EC2 Docker** | `client` |
| 백엔드·메시지·관측 | **AWS EC2** (Compose) | producer, consumer, Kafka, Prometheus, Grafana |
| 문서 DB | **MongoDB Atlas** | EventLog, ChatbotLog, Inventory |
| 관계 DB | **Neon** | User, Recipe, Ingredient |
| 캐시 | **Upstash** | Redis |

설계 원칙: **저비용·저트래픽**, EC2는 앱·Kafka·관측만, 데이터는 매니지드 SSOT.

## 환경별 배치

### 프로덕션

| 컴포넌트 | 위치 | Compose |
| --- | --- | --- |
| client | Vercel **또는** EC2 | `compose-client.yml` (EC2 시) |
| producer | EC2 | `compose-producer.yml` |
| consumer | EC2 | `compose-consumer.yml` |
| Kafka | EC2 | `compose-kafka.yml` |
| Prometheus/Grafana | EC2 | `compose-monitoring.yml` |
| DB·Redis | Atlas / Neon / Upstash | — |
| kafka-ui | **미배포** | 개발 전용 |

### 개발 (로컬)

| 컴포넌트 | 위치 |
| --- | --- |
| producer, consumer, client | **호스트** (`pnpm run start:*`) |
| DB, Redis, Kafka, 관측 | **Docker Compose** |
| compose-producer/consumer/client | **미기동** |

→ [로컬 개발/온보딩](./getting-started)

## 프론트엔드 배포 선택

| 옵션 | 적합한 경우 |
| --- | --- |
| **Vercel** (권장) | Preview, ISR, CDN, 제로옵스 |
| **EC2 Docker** | 단일 EC2 통합, Vercel 미사용 |

공통: `NEXT_PUBLIC_API_BASE_URL` → EC2 API 도메인. EC2 Docker 시 `FRONTEND_APP_BASE_URL`은 Nginx 뒤 클라이언트 URL.

## Compose 파일 (`docker/`)

| 파일 | 대상 | prod | dev |
| --- | --- | --- | --- |
| `compose-database.yml` | mongo, postgres, redis | ✗ | ✓ |
| `compose-kafka.yml` | kafka | ✓ | ✓ |
| `compose-kafka-ui.yml` | kafka-ui | ✗ | ✓ |
| `compose-monitoring.yml` | prometheus, grafana | ✓ | ✓ |
| `compose-producer.yml` | producer | ✓ | ✗ |
| `compose-consumer.yml` | consumer | ✓ | ✗ |
| `compose-client.yml` | client | EC2 시 | 선택 |

기동 순서: **인프라 Compose 먼저** → 앱 Compose.

## EC2 운영 요약

| 항목 | 값 |
| --- | --- |
| 인스턴스 | t4g.medium, Ubuntu 22.04 |
| 리버스 프록시 | Nginx (TLS 종료) |
| Inbound | 80, 443, 22(관리 IP) |
| API p95 목표 | 500ms 미만 |
| Kafka 지연 | 수 초 이내 |

## 환경 변수 파일

| 파일 | 용도 |
| --- | --- |
| `.env.docker` | 인프라 Compose |
| `client/.env` | 호스트 client |
| `server/producer/.env` | 호스트 producer |
| `server/consumer/.env` | 호스트 consumer |
| `*.env.docker` | Docker로 앱 기동 시 |

## 릴리스 흐름 (요약)

1. CI 통과 (`pnpm run ci`)
2. DB 마이그레이션 (`db:prisma:migrate:deploy`)
3. EC2: producer → consumer 이미지 빌드·기동
4. Vercel: client 배포 (또는 compose-client)
5. 헬스·메트릭·validation 시나리오 확인

상세: `agent/common/deployment_strategy.md` §7

## 관련 문서

- [시스템 아키텍처](./architecture)
- [Observability](../other/observability)

## SSOT

- `agent/common/deployment_strategy.md`
- `README.md` (Usage)
