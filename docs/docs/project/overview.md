# 프로젝트 개요

## 이 문서로 해결할 질문

- Mealio는 어떤 서비스인가요?
- 핵심 기능과 기술 스택은 무엇인가요?
- 데이터·이벤트 처리의 큰 그림은 무엇인가요?

## 서비스 소개

**Mealio**는 AI 기반 맞춤형 레시피 추천 플랫폼입니다. 사용자의 보유·관심 재료와 행동 이력을 반영해 레시피를 추천하고, Function Calling 기반 챗봇으로 요리 가이드를 제공합니다.

## 핵심 기능

| 기능 | 설명 |
| --- | --- |
| 보유·관심 재료 관리 | Inventory(MongoDB)로 사용자별 재료 상태 관리 |
| 관심 레시피 | 즐겨찾기·추천 점수 반영 |
| 맞춤 레시피 | `UserRecipeRecommendation` 원본 테이블 + 이벤트 기반 갱신 |
| 레시피 검색·상세 | PostgreSQL + Redis 캐시, ISR 페이지 |
| 레시피 추천 챗봇 | OpenAI Function Calling, SSE 스트리밍 |
| 레시피 데이터 ETL | 공공데이터 → OpenAI Batch → persist 파이프라인 |

## 기술 스택

| 영역 | 기술 |
| --- | --- |
| Frontend | Next.js (App Router), TypeScript, React Query |
| Backend API | NestJS (`producer`) |
| 비동기 처리 | Kafka Consumer (`consumer`) |
| RDB | PostgreSQL + Prisma |
| NoSQL | MongoDB + Mongoose |
| Cache | Redis (Upstash / 로컬) |
| Message Broker | Kafka |
| LLM | OpenAI API |
| Observability | Sentry, Prometheus, Grafana, GA4 |
| 문서·계약 | OpenAPI, Storybook, Docusaurus |

## 아키텍처 한 줄 요약

```text
client → producer (실시간 API + 캐시 + Kafka 발행)
              ↓ Kafka
         consumer (이벤트·추천·챗봇·ETL·KPI)
              ↓
    PostgreSQL / MongoDB / Redis / OpenAI
```

상세: [시스템 아키텍처](./architecture)

## 이벤트 드리븐 설계

Producer는 **명령(쓰기) API 성공 = Kafka 발행**까지 책임집니다. DB 반영·추천 갱신·캐시 무효화는 Consumer가 비동기로 처리합니다.

| Kafka 토픽 | 용도 |
| --- | --- |
| `user-events` | 프로필·재료함·관심 레시피 |
| `activity-events` | 조회·검색·좋아요 |
| `chatbot-requests` | 챗봇 메시지 |
| `cache-invalidation` | Redis 키 삭제 |

프론트는 Optimistic UI로 즉시 반영하고, Consumer 완료 후 캐시가 정합됩니다.

## 레시피 데이터

- **원천**: 식약처 공공데이터 (조리식품 레시피 DB)
- **수집**: Consumer standalone job (fetch → submit → retrieve → persist)
- **가공**: OpenAI Batch API로 정규화·매핑

→ [레시피 수집(ETL)](./recipe-ingestion)

## 모노레포 패키지

| 패키지 | 역할 |
| --- | --- |
| `client` | Next.js 프론트엔드 |
| `server/producer` | REST API |
| `server/consumer` | Kafka Consumer·배치 |
| `server/shared` | Prisma/Mongoose/Redis/타입 |
| `docs` | Docusaurus 문서 사이트 |
| `docs/` | 공개 문서 사이트 |

→ [모노레포 구조](./monorepo)

## 관련 문서

- [도메인 개요](./domain)
- [로컬 개발/온보딩](./getting-started)
- [배포/환경 전략](./deployment)

## 참고 코드·계약

- [프로젝트 개요](../project/overview)
- `README.md`
