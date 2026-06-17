# 챗봇 UI/스트리밍

## 이 문서로 해결할 질문

- 클라이언트는 챗봇 응답 스트림을 어떻게 구독·렌더링하나요?
- `ChatbotStreamEvent` 타입별 UI 동작은 무엇인가요?
- 대화 목록·상세 캐시는 어떻게 갱신하나요?

## 전체 흐름

```text
사용자 입력
  → POST /api/v1/chatbot/messages (Producer)
  → Kafka chatbot-requests
  → Consumer (GPT + tool calls)
  → Redis chatbot:stream:{streamChannelId}
  → Producer SSE 구독
  → client EventSource / ReadableStream
  → UI 갱신
```

상세 시퀀스: [챗봇/SSE](../producer/chatbot-sse), [챗봇 처리](../consumer/chatbot)

## SSE 이벤트 타입

`ChatbotStreamEvent` (`@mealio/shared`):

| type | UI 동작 |
| --- | --- |
| `chunk` | 어시스턴트 메시지 스트리밍 텍스트 append |
| `tool_call` | 도구 호출 중 상태 표시 (선택) |
| `done` | 턴 완료. `conversationId`, `isCreditDepleted`, `suggestedRecipes` 반영 |
| `error` | 오류 메시지 + 재시도 액션 (Toast `action`) |

`done.data.suggestedRecipes`가 있으면 `SuggestedRecipeBubble` / `SuggestedRecipeSlider`로 표시합니다.

## 주요 페이지·컴포넌트

| 경로 | 파일 | 역할 |
| --- | --- | --- |
| `/chatbot/list` | `ChatbotConversationListClientPage.tsx` | 대화 목록 |
| `/chatbot/[id]` | `ChatbotConversationClientPage.tsx` | 메시지 전송·SSE 구독 |
| 컴포넌트 | `client/src/components/chatbot/` | 버블·입력·슬라이더 등 |

컴포넌트 배치: [컴포넌트 구조](../client/components) · client/src/components/ (chatbot)

## React Query 연동

`client/src/lib/queries/chatbot.queries.ts`

| 훅 | 용도 |
| --- | --- |
| `useConversationListInfinite` | 대화 목록 무한 스크롤 |
| `useConversationDetail` | 단일 대화 메시지 |
| `invalidateChatbotAfterStreamDone` | `done` 수신 후 목록·상세 캐시 갱신 |

캐시 정책: `QUERY_CACHE.chatbot` — staleTime 30초

## 크레딧 소진 UX

`done.data.isCreditDepleted === true`이면 잔액 소진 안내(인라인 Alert 등)를 표시합니다. 크레딧 차감 로직은 Consumer 책임입니다.

## GA4 계측

`chatbot_message_sent` — `ChatbotConversationClientPage.tsx`에서 전송.

→ [이벤트/분석 파이프라인](../consumer/analytics-pipeline)

## 보호 라우트

`/chatbot/*`는 Proxy에서 `refreshToken` 쿠키 검사. 미로그인 시 `/login?next=` 리다이렉트.

→ [인증](./auth)

## 관련 문서

- [챗봇/SSE](../producer/chatbot-sse)
- [챗봇 처리](../consumer/chatbot)
- [에러 처리/Toast](./error-toast)
