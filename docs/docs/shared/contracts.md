# 공유 계약

## 이 문서로 해결할 질문

- Kafka·SSE·도메인 이벤트 타입은 어디에 정의되나요?
- Producer와 Consumer가 공유하는 계약 목록은 무엇인가요?
- 캐시 무효화·챗봇 크레딧·레시피 수집 상수는 어디서 관리하나요?

## Kafka 토픽

Kafka 토픽 상수는 `server/shared/.../kafka-topics.ts`에 정의되어 있습니다.

| 상수 | 토픽명 |
| --- | --- |
| `CHATBOT_REQUESTS` | `chatbot-requests` |
| `USER_EVENTS` | `user-events` |
| `ACTIVITY_EVENTS` | `activity-events` |
| `CACHE_INVALIDATION` | `cache-invalidation` |
| `RECIPE_INGESTION_PARSE_SUBMIT_TRIGGERED` | `recipe-ingestion-parse-submit-triggered` |
| `RECIPE_INGESTION_PERSIST_TRIGGERED` | `recipe-ingestion-persist-triggered` |
| `RECIPE_INGESTION_EMBED_SUBMIT_TRIGGERED` | `recipe-ingestion-embed-submit-triggered` |

DLQ는 `KAFKA_DLQ_TOPICS.*` 상수로 정의되며, 메인 토픽마다 `-dlq` 접미사를 붙입니다.

## 이벤트 타입 (`types/events/`)

| 파일 | 용도 |
| --- | --- |
| `user-event.event.ts` | signup, login, nickname.update |
| `inventory-event.event.ts` | ingredient.*, recipe.favorites_* |
| `activity-event.event.ts` | recipe.view, recipe.share, search.* |
| `chatbot-request.event.ts` | 챗봇 Kafka 페이로드 |
| `chatbot-stream-event.event.ts` | SSE chunk/done/error |
| `cache-invalidation.event.ts` | USER_PROFILE, INVENTORY, RECIPE, RECOMMENDATION, INGREDIENT |

이벤트 이름과 KPI 매핑은 [Observability](../other/observability) 문서를 참고하세요.

## Redis 채널

Redis Pub/Sub 채널 헬퍼는 `server/shared/.../redis-channels.ts`에 정의되어 있습니다.

- `getChatbotStreamChannel(streamChannelId)`는 `chatbot:stream:{id}` 형식의 채널 이름을 반환합니다.

## 캐시 키

캐시 키 규칙은 [Redis 키/캐시 계약](./redis-cache-contract) 문서를 참고하세요.

## 챗봇 크레딧

챗봇 크레딧 정책은 `server/shared/.../user-credits.policy.ts`에 정의되어 있으며, `DEFAULT_USER_CREDIT_BALANCE`·`DEFAULT_USER_CREDIT_MONTHLY_LIMIT`·`computeChatbotCreditCost()`를 제공합니다.

- Producer의 User 생성과 Consumer의 크레딧 차감에서 동일한 정책을 사용합니다.

## Recipe Ingestion

`server/shared/.../recipe-ingestion.ts`에는 status enum과 source 상수가 정의되어 있습니다.

`recipe-ingestion.policy.ts`에는 retry·batch size·TTL 정책이 정의되어 있습니다.

## Observability

- `observability.config.ts`에서 `METRICS_ENABLED` 등 관측 설정을 검증합니다.
- `observability.policy.ts`에서 `SLOW_QUERY_THRESHOLD_MS`(슬로우 쿼리 임계값)를 정의합니다.
- `sentry.constants.ts`에서 Sentry 태그와 민감 키 패턴을 정의합니다.

## 변경 절차

1. shared 패키지의 타입·상수를 수정합니다.
2. Producer 발행 코드와 Consumer 소비 코드를 동기화합니다.
3. [Observability](../other/observability)·API 계약·패키지 문서를 갱신합니다.
4. 로컬에서는 Kafka 토픽을 재생성하고, 운영 환경에서는 마이그레이션 계획을 수립합니다.

## 관련 문서

- [개요](./overview)
- [Redis 키/캐시 계약](./redis-cache-contract)
- [이벤트 발행](../producer/event-publishing)
- [Kafka 소비/신뢰성](../consumer/kafka-reliability)
- [캐시 무효화](../consumer/cache-invalidation)
