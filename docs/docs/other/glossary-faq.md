# 용어집/FAQ

신규 기여자·문서 독자를 위한 도메인 용어와 자주 묻는 질문.

## 도메인 용어

| 용어 | 설명 |
| --- | --- |
| **Producer** | NestJS API 서버 (`server/producer`). 실시간 HTTP·캐시·Kafka 발행 |
| **Consumer** | Kafka 워커 (`server/consumer`). 비동기 처리·GPT·ETL |
| **Shared** | `@mealio/shared` — Prisma/Mongoose/Redis/이벤트 타입 |
| **Inventory** | 사용자 보유·관심 재료·관심 레시피 상태 (MongoDB) |
| **추천 원본 테이블** | `UserRecipeRecommendation` 테이블 — 개인화 추천 결과 원본 |
| **EventLog** | 도메인 이벤트 MongoDB 로그 (`event_logs`, 90일 TTL) |
| **Cache-Aside** | Redis 조회 → miss 시 DB → 캐시 저장 패턴 |
| **Optimistic UI** | API 성공 후 React Query 캐시 직접 갱신 (refetch 안 함) |
| **refresh-bridge** | SSR 401 시 토큰 갱신용 Next.js Route Handler |
| **streamChannelId** | 챗봇 SSE 스트림·크레딧 멱등 차감 단위 ID |
| **DLQ** | Dead Letter Queue — Kafka 처리 실패 메시지 보관 토픽 |

## 아키텍처 FAQ

### Producer와 Consumer를 왜 나누나요?

쓰기 API는 빠르게 응답(Kafka 발행)하고, 무거운 작업(추천 갱신·GPT·ETL)은 비동기로 처리합니다. 독립 스케일·장애 격리가 가능합니다.

### HTTP 200인데 화면에 반영이 안 될 때?

Command API 성공은 Kafka 발행까지입니다. Consumer lag·DLQ를 확인하세요. 프론트는 Optimistic UI로 즉시 반영해야 합니다.

→ [이벤트 발행](../producer/event-publishing), [Kafka 소비/신뢰성](../consumer/kafka-reliability)

### 로컬에서 Kafka 없이 개발할 수 있나요?

인프라 Compose로 Kafka를 띄우는 것이 기본입니다. Producer 기동 시 로컬 토픽이 자동 생성됩니다.

→ [로컬 개발/온보딩](../project/getting-started)

### OAuth는 왜 백엔드 주도인가요?

Client Secret·Redirect URI·토큰 교환을 서버에만 두어 보안을 강화합니다. 프론트는 진입 URL과 세션 조회만 담당합니다.

→ [인증 (client)](../client/auth)

### 추천이 느리게 바뀔 때?

`kpi_recommendation_e2e_latency` — favorites_add 이후 원본·캐시 반영까지 지연. `user-events` lag·RecommendationHandler 확인.

→ [추천 시스템](../project/recommendation), [운영/복구](../consumer/operations)

## 문서 FAQ

### 코드와 문서가 다를 때?

**문서 또는 코드 중 하나가 잘못된 것** — 문서·코드 정합성 원칙에 따라 동기화 PR을 올립니다.

### Docusaurus 문서는 무엇을 다루나?

- 본 문서 사이트 — 공개 아키텍처·운영 문서
- `docs/` — Docusaurus 탐색·온보딩용 (링크·요약)

계획: docs/sidebars.ts 및 본 문서 사이트

### 새 API를 추가할 때?

1. server/producer/src/modules/ (Swagger DTO)
2. [Producer 도메인 API](../producer/domain-api)
3. (필요 시) [Observability](./observability) 이벤트 사전
4. Docusaurus [도메인 API 가이드](../producer/domain-api)

## 빠른 링크

| 목적 | 문서 |
| --- | --- |
| 처음 실행 | [로컬 개발](../project/getting-started) |
| 전체 구조 | [시스템 아키텍처](../project/architecture) |
| 기여 | [기여 가이드](./contributing) |
