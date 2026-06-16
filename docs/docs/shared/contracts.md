---
title: 공유 계약
---

# 공유 계약

## 이 문서로 해결할 질문

- Kafka·SSE·도메인 이벤트 타입은 어디에 정의되나요?
- Producer와 Consumer가 공유하는 계약 목록은 무엇인가요?

## Kafka 토픽

`server/shared/src/constants/kafka-topics.ts`

| 상수 | 토픽명 |
| --- | --- |
| `CHATBOT_REQUESTS` | `chatbot-requests` |
| `USER_EVENTS` | `user-events` |
| `ACTIVITY_EVENTS` | `activity-events` |
| `CACHE_INVALIDATION` | `cache-invalidation` |
| `RECIPE_INGESTION_RETRIEVED` | `recipe-ingestion-retrieved` |

DLQ: `KAFKA_DLQ_TOPICS.*` — 메인 토픽별 `-dlq` suffix.

## 이벤트 타입 (`types/events/`)

| 파일 | 용도 |
| --- | --- |
| `user-event.event.ts` | signup, login, nickname.update |
| `inventory-event.event.ts` | ingredient.*, recipe.favorites_* |
| `activity-event.event.ts` | recipe.view, search.* |
| `chatbot-request.event.ts` | 챗봇 Kafka 페이로드 |
| `chatbot-stream-event.event.ts` | SSE chunk/done/error |
| `cache-invalidation.event.ts` | USER_PROFILE, INVENTORY, RECIPE, RECOMMENDATION |

이벤트 이름·KPI 매핑: [Observability](../other/observability)

## Redis 채널

`server/shared/src/constants/redis-channels.ts`

- `getChatbotStreamChannel(streamChannelId)` → `chatbot:stream:{id}`

## 캐시 키

→ [Redis 키/캐시 계약](./redis-cache-contract)

## 챗봇 크레딧

`server/shared/src/policy/user-credits.policy.ts`

- `DEFAULT_USER_CREDIT_BALANCE`, `computeChatbotCreditCost()`
- Producer User 생성·Consumer 차감에서 동일 정책 사용

## Recipe Ingestion

`server/shared/src/constants/recipe-ingestion.ts` — status enum, source 상수

`recipe-ingestion.policy.ts` — retry, batch size, TTL

## Observability

- `observability.config.ts` — METRICS_ENABLED, SLOW_QUERY_THRESHOLD_MS
- `sentry.constants.ts` — 태그·민감 키 패턴

## 변경 절차

1. shared 타입·상수 수정
2. Producer 발행 / Consumer 소비 코드 동기화
3. [Observability](../other/observability)·API 계약·패키지 문서 갱신
4. 로컬 Kafka 토픽 재생성 (dev) 또는 마이그레이션 계획 (prod)

## 관련 문서

- [이벤트 발행](../producer/event-publishing)
- [Kafka 소비/신뢰성](../consumer/kafka-reliability)

## 참고 코드·계약

- [Shared 개요](../shared/overview) · server/shared/src/
- `server/shared/src/types/events/`
- [Observability](../other/observability)
