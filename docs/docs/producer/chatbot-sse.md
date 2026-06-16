# 챗봇/SSE

## 이 문서로 해결할 질문

- Producer가 챗봇 요청을 받아 SSE로 스트리밍하는 흐름은 무엇인가요?
- Redis 채널·이벤트 계약은 무엇인가요?
- SSE 연결 종료 조건은 무엇인가요?

## 6단계 흐름

```text
1. POST /api/v1/chatbot/messages → streamChannelId 발급
2. Kafka chatbot-requests 발행 (userId, message, conversationId?, streamChannelId)
3. Consumer ProcessChatHandler — GPT 스트리밍 + tool calls
4. Consumer → Redis chatbot:stream:{streamChannelId} 이벤트 발행
5. Producer Redis 구독 → SSE data: {JSON}\n\n 전달
6. done/error/타임아웃 시 구독 해제
```

## API

| Method | Path | 역할 |
| --- | --- | --- |
| POST | `/api/v1/chatbot/messages` | 메시지 전송, `streamChannelId` 반환 |
| GET | `/api/v1/chatbot/stream/{streamChannelId}` | SSE 스트림 구독 |

인증: JWT 필수 (`JwtAuthGuard`)

## Redis·이벤트 계약

| 항목 | 값 |
| --- | --- |
| 채널 | `chatbot:stream:{streamChannelId}` |
| 헬퍼 | `@mealio/shared` `getChatbotStreamChannel()` |
| 이벤트 | `ChatbotStreamEvent` |

### 이벤트 타입

| type | payload 요약 |
| --- | --- |
| `chunk` | 스트리밍 텍스트 조각 |
| `tool_call` | Function Calling 진행 |
| `done` | `conversationId`, `isCreditDepleted`, 선택 `suggestedRecipes` |
| `error` | 오류 메시지 |

`done` 계약 상세: Consumer §2.4 — [챗봇 처리](../consumer/chatbot)

## Kafka 페이로드

토픽: `chatbot-requests` (`KAFKA_TOPICS.CHATBOT_REQUESTS`)

```json
{
  "userId": 1,
  "message": "오늘 뭐 먹지?",
  "conversationId": "optional-uuid",
  "streamChannelId": "uuid"
}
```

대용량 도메인 배열은 **포함하지 않습니다**. GPT tool call 시 Consumer가 DB/Redis에서 조회합니다.

## Producer 모듈

| 경로 | 역할 |
| --- | --- |
| `modules/chatbot/chatbot.controller.ts` | messages·stream 엔드포인트 |
| `modules/chatbot/chatbot.service.ts` | Kafka 발행, Redis 구독, SSE 전달 |

## 설계 원칙

- Producer는 GPT를 호출하지 않음 — 비동기 처리는 Consumer 전담
- SSE는 Redis 이벤트를 **그대로** 클라이언트에 전달 (변환 최소화)
- `streamChannelId`당 크레딧 멱등 차감 — Consumer `ChatbotCreditService`

## 관련 문서

- [챗봇 UI/스트리밍](../client/chatbot-ui)
- [챗봇 처리](../consumer/chatbot)
- [이벤트 발행](./event-publishing)

## 참고 코드·계약

- [Producer 아키텍처](../producer/architecture) · server/producer/src/ (§1.2)
- [개발 규약](../other/development-conventions) (§5)
- [Producer API](../producer/api) · server/producer/src/modules/
