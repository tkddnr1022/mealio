---
title: 이벤트 발행
---

# 이벤트 발행

## 이 문서로 해결할 질문

- Producer가 어떤 Kafka 토픽에 무엇을 발행하나요?
- 발행 시점과 HTTP 응답의 관계는 무엇인가요?
- Consumer와의 계약은 어디서 확인하나요?

## 발행 원칙

- **쓰기 API 성공 = Kafka 메시지 발행 성공** (DB 최종 반영은 Consumer)
- 페이로드는 `@mealio/shared` 이벤트 타입을 따름
- Correlation-Id는 메시지에 전파

## 토픽별 발행

| 토픽 | 발행 트리거 (Producer API) | payload 요약 |
| --- | --- | --- |
| `user-events` | 닉네임 변경, 재료·관심 레시피 CRUD | `UserEvent` / `InventoryEvent` |
| `activity-events` | 조회수, 검색어, 검색 클릭, 좋아요·공유 | `ActivityEvent` |
| `chatbot-requests` | `POST /chatbot/messages` | userId, message, conversationId?, streamChannelId |

`cache-invalidation`은 **Producer가 직접 발행하지 않음** — Consumer `CacheInvalidationRequestService`가 발행.

## user-events 예

| API | 이벤트 type |
| --- | --- |
| PATCH nickname | `nickname.update` |
| POST 관심 레시피 | `recipe.favorites_add` |
| DELETE 관심 레시피 | `recipe.favorites_remove` |
| POST 보유 재료 | `ingredient.add` |

Consumer: 프로필 갱신, Inventory, EventLog, **추천 점수**, 캐시 무효화 요청.

## activity-events 예

| API | 이벤트 type |
| --- | --- |
| POST `.../views` | `recipe.view` |
| POST `search-queries` | `search.query` |
| POST `search-clicks` | `search.click` |

dedupe: Redis `dedupe:*` 키 (30분 TTL, actor 기준). 비로그인은 `ip:{ip}`.

## chatbot-requests

```json
{
  "userId": 1,
  "message": "오늘 뭐 먹지?",
  "conversationId": "optional",
  "streamChannelId": "uuid"
}
```

Consumer가 GPT 처리 후 Redis 스트림 → Producer SSE.

## 구현 위치

| 경로 | 역할 |
| --- | --- |
| `infrastructure/kafka/producer.service.ts` | Kafka produce |
| `modules/*/...service.ts` | 도메인별 발행 호출 |

로컬: `KafkaAdminService`가 토픽·DLQ 자동 생성 (`APP_ENV !== production`).

## 관련 문서

- [Kafka 소비/신뢰성](../consumer/kafka-reliability)
- [이벤트/분석 파이프라인](../consumer/analytics-pipeline)
- [도메인 API 가이드](./domain-api)

## 참고 코드·계약

- [Consumer 아키텍처](../consumer/architecture) · server/consumer/src/ (§2.2)
- `server/shared/src/constants/kafka-topics.ts`
- [Observability](../other/observability)
