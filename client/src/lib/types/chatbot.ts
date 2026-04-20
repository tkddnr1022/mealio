/**
 * 챗봇 도메인 타입.
 *
 * 두 종류의 계약을 모두 포함한다:
 * 1. REST (`GET /chatbot/conversations*`) 응답 shape
 * 2. SSE 스트림 이벤트(`POST /chatbot/messages`의 `data:` 페이로드)
 *
 * 스트림 이벤트 타입·파서 구현은 `@/lib/chatbot/stream-events.ts`가
 * 이 파일의 타입을 재사용한다. 백엔드 공유 정의:
 * `server/shared/src/types/events/chatbot-stream-event.event.ts`.
 */

// ─── 추천 레시피 ───────────────────────────────────────────────────────────────

/** SSE `done` 이벤트가 포함하는 추천 레시피 레코드 */
export interface SuggestedRecipe {
  id: number;
  title: string;
  categoryId: number;
  categoryName: string;
  /** 매칭 점수 (0~100) */
  matchScore: number;
}

// ─── 대화 REST 응답 ────────────────────────────────────────────────────────────

/** 대화 목록 1건 */
export interface ConversationListItem {
  conversationId: string;
  /** ISO 8601 */
  lastMessageAt: string;
}

/** `GET /chatbot/conversations` 응답 */
export interface ConversationList {
  items: ConversationListItem[];
  /** 다음 페이지 커서. null이면 마지막 페이지 */
  nextCursor: string | null;
}

/** `GET /chatbot/conversations` 쿼리 파라미터 */
export interface ConversationListQuery {
  /** 한 페이지당 항목 수 (기본 20, 최대 100) */
  limit?: number;
  /** 이전 응답의 nextCursor */
  cursor?: string;
}

/** 대화 메시지 1건 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  message: string;
  /** assistant 메시지의 추천 레시피 ID 목록. 상세는 `getRecipeSummaries`로 조회 */
  suggestedRecipeIds: number[] | null;
  /** ISO 8601 */
  createdAt: string;
}

/** `GET /chatbot/conversations/:conversationId` 응답 */
export interface Conversation {
  conversationId: string;
  messages: ConversationMessage[];
}

// ─── SSE 스트림 이벤트 ────────────────────────────────────────────────────────

/** SSE 이벤트 `type` 판별자 union */
export type ChatbotStreamEventType = 'chunk' | 'done' | 'error' | 'tool_call';

/** 부분 텍스트 청크 */
export interface ChatbotStreamChunkEvent {
  type: 'chunk';
  data: string;
}

/** 스트림 종료. 확정된 `conversationId`와 추천 레시피가 전달된다. */
export interface ChatbotStreamDoneEvent {
  type: 'done';
  data: {
    conversationId: string;
    suggestedRecipes?: SuggestedRecipe[];
  };
}

/** 서버 측 에러. 클라이언트는 사용자에게 메시지 표시 후 스트림을 종료한다. */
export interface ChatbotStreamErrorEvent {
  type: 'error';
  data: { message: string };
}

/** Function Calling 진행 중 클라이언트 피드백용 (예: "레시피 검색 중…") */
export interface ChatbotStreamToolCallEvent {
  type: 'tool_call';
  data: {
    functionName: string;
    status: 'start' | 'complete';
    arguments?: string;
  };
}

/** SSE 스트림에서 수신되는 모든 이벤트의 union */
export type ChatbotStreamEvent =
  | ChatbotStreamChunkEvent
  | ChatbotStreamDoneEvent
  | ChatbotStreamErrorEvent
  | ChatbotStreamToolCallEvent;

// ─── 요청 body ────────────────────────────────────────────────────────────────

/** `POST /chatbot/messages` 요청 body (SSE 엔드포인트) */
export interface SendChatbotMessageRequest {
  message: string;
  /** 진행 중인 대화 ID. 생략 시 서버가 새 대화를 만든다. */
  conversationId?: string;
}
