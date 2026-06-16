---
title: 챗봇 처리
---

# 챗봇 처리

## 이 문서로 해결할 질문

- Consumer가 챗봇 메시지를 어떻게 처리하는가?
- GPT Function Calling·tool handler 구조는?
- 크레딧 멱등 차감은 어떻게 보장하는가?

## 처리 파이프라인

토픽: `chatbot-requests` / 그룹: `chatbot-group`

```text
Kafka consume
  → ProcessChatHandler (GPT 스트리밍 + tool dispatch)
  → tool handlers (Inventory, FoodCategories, SearchRecipes 등)
  → Redis stream 이벤트 발행 (chunk / tool_call / done / error)
  → SaveChatLogHandler (ChatbotLog 저장)
  → SyncConversationMetaHandler (대화 메타)
  → ChatbotCreditService (멱등 크레딧 차감)
```

## ProcessChatHandler

| 단계 | 동작 |
| --- | --- |
| 1 | `conversation.manager` — `buildMessagesForGpt()`로 메시지 배열 구성 |
| 2 | OpenAI Chat Completions 스트리밍 호출 |
| 3 | `tool_calls` 발생 시 해당 Handler 디스패치 |
| 4 | 응답 chunk를 Redis `chatbot:stream:{streamChannelId}`에 발행 |
| 5 | 턴 완료 시 `done` 이벤트 + 크레딧 차감 |

경로: `consumers/chatbot-request/handlers/ProcessChatHandler.ts`

## Tool Handlers

| Handler | tool | 역할 |
| --- | --- | --- |
| `InventoryHandler` | `get_user_inventory` | 보유/관심 재료·레시피 조회 |
| `FoodCategoriesHandler` | `get_food_categories` | 카테고리 마스터 (Redis 1h) |
| `SearchRecipesHandler` | `search_recipes` | 레시피 검색 |

도구 정의: `chatbot-tools.definition.ts`

설계 원칙: Kafka 페이로드에 대용량 배열을 넣지 않고, tool 호출 시 DB/Redis에서 조회합니다.

## ChatbotLog 저장

- 컬렉션: `chatbot_logs` (MongoDB, 30일 TTL)
- `SaveChatLogHandler` — user/assistant 턴을 `conversationId`와 함께 저장
- 히스토리 확장: `conversationId` 기준 최근 N턴 조회 → `buildMessagesForGpt`

## 크레딧 멱등 차감

| 항목 | 계약 |
| --- | --- |
| 테이블 | `chatbot_credit_deductions` (PK: `stream_channel_id`) |
| 서비스 | `ChatbotCreditService` |
| 멱등 | `createMany` + `skipDuplicates` — 동일 `streamChannelId` 이중 차감 방지 |
| 비용 | `usage.totalTokens` → `computeChatbotCreditCost()` |
| `done` 반영 | `isCreditDepleted` in `ChatbotStreamDoneEvent` |

신규 차감 발생 시 `cache-invalidation`(USER_PROFILE) 발행.

## 이벤트·KPI

| EventLog | 시점 |
| --- | --- |
| `chatbot.start` | 대화 시작 |
| `chatbot.message` | 메시지 처리 성공 |

→ [이벤트/분석 파이프라인](./analytics-pipeline)

## 신뢰성

- at-least-once Kafka → 크레딧·로그는 멱등 키로 중복 안전
- 실패 시 DLQ: `chatbot-requests-dlq`
- lag 모니터링: `consumer-lag.monitor.ts`

## 관련 문서

- [챗봇/SSE](../producer/chatbot-sse)
- [챗봇 UI/스트리밍](../client/chatbot-ui)
- [캐시](./cache)

## 참고 코드·계약

- [Consumer 아키텍처](../consumer/architecture) · server/consumer/src/ (§2.3, §2.4)
- [개발 규약](../other/development-conventions) (§5)
