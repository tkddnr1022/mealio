# 용어집/FAQ

## 이 문서로 해결할 질문

- Mealio에서 자주 쓰는 도메인·아키텍처 용어는 무엇인가요?
- HTTP 200인데 화면이 안 바뀔 때 어디를 보나요?
- 코드와 문서가 다를 때 어떻게 하나요?

신규 기여자와 문서 독자를 위해 자주 쓰는 도메인 용어와 자주 묻는 질문을 정리합니다.

## 도메인 용어

| 용어 | 설명 |
| --- | --- |
| **Producer** | NestJS API 서버 (`server/producer`). 실시간 HTTP·캐시·Kafka 발행 |
| **Consumer** | Kafka 워커 (`server/consumer`). 비동기 처리·GPT·ETL |
| **Shared** | `@mealio/shared` — Prisma/Mongoose/Redis/이벤트 타입 |
| **Inventory** | 사용자 보유·관심 재료·관심 레시피 상태 (MongoDB) |
| **추천 원본 테이블** | `UserRecipeRecommendation` — 개인화 추천 결과 원본 |
| **EventLog** | 도메인 이벤트 MongoDB 로그 (`event_logs`, 90일 TTL) |
| **Cache-Aside** | Redis 조회 → miss 시 DB → 캐시 저장 패턴 |
| **Optimistic UI** | API 성공 후 React Query 캐시 직접 갱신 (refetch 안 함) |
| **refresh-bridge** | SSR 401 시 토큰 갱신용 Next.js Route Handler |
| **streamChannelId** | 챗봇 SSE 스트림·크레딧 멱등 차감 단위 ID |
| **DLQ** | Dead Letter Queue — Kafka 처리 실패 메시지 보관 토픽 |

## 아키텍처 FAQ

### Producer와 Consumer를 왜 나누나요?

쓰기 API는 Kafka 발행까지 빠르게 응답하고, 추천 갱신·GPT·ETL 같은 무거운 작업은 비동기로 처리합니다. 이 구조로 패키지를 독립적으로 스케일하고 장애를 격리할 수 있습니다.

### HTTP 200인데 화면에 반영이 안 될 때?

Command API가 성공해도 화면 반영은 Kafka 발행까지만 보장됩니다. Consumer lag와 DLQ를 확인하고, 프론트에서는 Optimistic UI로 즉시 반영해야 합니다.

[이벤트 발행](../producer/event-publishing)과 [Kafka 소비/신뢰성](../consumer/kafka-reliability) 문서를 참고합니다.

### 로컬에서 Kafka 없이 개발할 수 있나요?

인프라 Compose로 Kafka를 띄우는 것이 기본입니다. Producer 기동 시 로컬 토픽이 자동 생성됩니다.

[로컬 개발/온보딩](../project/getting-started) 문서를 참고합니다.

### OAuth는 왜 백엔드 주도인가요?

Client Secret·Redirect URI·토큰 교환을 서버에만 두어 보안을 강화합니다. 프론트는 진입 URL과 세션 조회만 담당합니다.

[인증 (client)](../client/auth) 문서를 참고합니다.

### 추천이 느리게 바뀔 때?

`kpi_recommendation_e2e_latency`로 favorites_add 이후 원본·캐시 반영까지의 지연을 확인합니다. `user-events` 토픽 lag와 RecommendationHandler 처리 상태도 함께 점검합니다.

[추천 시스템](../project/recommendation)과 [Consumer 운영/복구](../consumer/operations) 문서를 참고합니다.

## 문서 FAQ

### 코드와 문서가 다를 때?

문서와 코드가 다르면 **둘 중 하나가 잘못된 상태**이므로, [기여 가이드](./contributing)의 문서·코드 정합성 원칙에 따라 동기화 PR을 올립니다.

### 공개 문서 사이트는 무엇을 다루나요?

공개 문서 사이트는 아키텍처·운영·온보딩을 **요약하고 교차 링크로 연결**합니다. 필드 단위 API나 전체 파일 트리 같은 구현 세부는 내부 명세·OpenAPI를 따릅니다.

[프로젝트 개요](../) 문서를 참고합니다.

### 새 API를 추가할 때?

1. `server/producer/.../modules/`에 모듈을 추가하고 Swagger DTO를 정의합니다.
2. [Producer 도메인 API](../producer/domain-api) 문서를 갱신합니다.
3. (필요 시) [Observability](./observability) 이벤트 사전에 등록합니다.
4. 본 문서 사이트의 해당 페이지를 함께 갱신합니다.

## 빠른 링크

| 목적 | 문서 |
| --- | --- |
| 처음 실행 | [로컬 개발](../project/getting-started) |
| 전체 구조 | [시스템 아키텍처](../project/architecture) |
| 기여 | [기여 가이드](./contributing) |

## 관련 문서

- [프로젝트 개요](../)
- [기여 가이드](./contributing)
- [개발 규약](./development-conventions)
- [Observability](./observability)
