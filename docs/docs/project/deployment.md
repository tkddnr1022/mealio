# 배포/환경 전략

## 이 문서로 해결할 질문

- dev와 prod에서 컴포넌트는 어디에 올라가나요?
- Compose 파일 역할과 기동 순서는 무엇인가요?

## 확정 스택 (MVP·초기 프로덕션)

| 계층 | 플랫폼 | 컴포넌트 |
| --- | --- | --- |
| 프론트엔드 | **Vercel** 또는 **AWS EC2** | client |
| 백엔드·메시지·관측 | **AWS EC2** (Docker) | producer, consumer, Kafka, Prometheus, Grafana |
| 문서 DB | **MongoDB Atlas** | `EventLog` `ChatbotLog` `Inventory` |
| 관계 DB | **Neon** | `User` `Recipe` `Ingredient` |
| 캐시 | **Upstash** | Redis |

설계 원칙은 **저비용·저트래픽**이며, EC2에는 앱·Kafka·관측만 두고 데이터는 매니지드 서비스를 사용합니다.

## 환경별 배치

### 프로덕션(예시)

| 컴포넌트 | 위치 | Compose |
| --- | --- | --- |
| client | Vercel **또는** EC2 | `compose-client.yml` |
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

기동 순서는 **인프라 Compose를 먼저** 기동한 뒤 앱 Compose를 기동합니다.

## 환경 변수 파일

| 파일 | 용도 |
| --- | --- |
| `.env.docker.local` | 인프라 Compose |
| `client/.env.local` | 호스트 client |
| `server/producer/.env.local` | 호스트 producer |
| `server/consumer/.env.local` | 호스트 consumer |
| `*.env.docker.local` | Docker로 앱 기동 시 |

변수별 사용처·예시·환경별 패턴은 [환경 변수](./getting-started#2-환경-변수-준비)와 패키지별 문서를 참고하세요.

## 릴리스 흐름 (요약)

1. CI가 통과해야 합니다 (`pnpm run ci`).
2. DB 마이그레이션을 적용합니다 (`db:prisma:migrate:deploy`).
3. EC2에서 producer와 consumer 이미지를 빌드·기동합니다.
4. Vercel에 client를 배포합니다(또는 compose-client를 사용합니다).
5. 헬스·메트릭·validation 시나리오를 확인합니다.

## 관련 문서

- [시스템 아키텍처](./architecture)
- [Observability](../other/observability)
