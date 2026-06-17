# 이벤트 발행

## 이 문서로 해결할 질문

- Producer가 어떤 Kafka 토픽에 무엇을 발행하나요?
- 발행 시점과 HTTP 응답의 관계는 무엇인가요?
- Consumer와의 계약은 어디서 확인하나요?

## 발행 원칙

- **쓰기 API 성공은 Kafka 메시지 발행 성공**을 의미하며, DB 최종 반영은 Consumer가 처리합니다.
- 페이로드는 `@mealio/shared` 이벤트 타입을 따릅니다.
- Correlation-Id는 메시지에 전파됩니다.

## 토픽별 발행

| 토픽 | 발행 트리거 (Producer API) | payload 요약 |
| --- | --- | --- |
| `user-events` | 닉네임 변경, 재료·관심 레시피 CRUD | `UserEvent` / `InventoryEvent` |
| `activity-events` | 조회수, 검색어, 검색 클릭, 좋아요·공유 | `ActivityEvent` |
| `chatbot-requests` | `POST /chatbot/messages` | userId, message, conversationId?, streamChannelId |

`cache-invalidation`은 **Producer가 직접 발행하지 않으며**, Consumer `CacheInvalidationRequestService`가 발행합니다.

## user-events 예

| API | 이벤트 type |
| --- | --- |
| POST `.../views` | `recipe.view` |
| POST `search-queries` | `search.query` |
| POST `search-clicks` | `search.click` |

Consumer는 프로필 갱신, Inventory 처리, EventLog 기록, **추천 점수** 갱신, 캐시 무효화 요청을 수행합니다.

## activity-events 예

| API | 이벤트 type |
| --- | --- |
| POST `.../views` | `recipe.view` |
| POST `search-queries` | `search.query` |
| POST `search-clicks` | `search.click` |

중복 제거는 Redis `dedupe:*` 키(30분 TTL, actor 기준)로 수행합니다. 비로그인 사용자는 `ip:{ip}`를 actor로 사용합니다.

## chatbot-requests

```json
{
  "userId": 1,
  "message": "오늘 뭐 먹지?",
  "conversationId": "optional",
  "streamChannelId": "uuid"
}
```

Consumer가 GPT 처리 후 Redis 스트림으로 이벤트를 발행하면 Producer가 SSE로 전달합니다.

## 구현 위치

| 경로 | 역할 |
| --- | --- |
| `infrastructure/kafka/producer.service.ts` | Kafka produce |
| `modules/*/...service.ts` | 도메인별 발행 호출 |

로컬 환경에서는 `KafkaAdminService`가 토픽·DLQ를 자동 생성합니다(`APP_ENV !== production`).

## 관련 문서

- [Kafka 소비/신뢰성](../consumer/kafka-reliability)
- [이벤트/분석 파이프라인](../consumer/analytics-pipeline)
- [도메인 API 가이드](./domain-api)
