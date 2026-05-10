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

/** SSE `done` 이벤트에 포함되는 레시피 요약(검색·도구 결과를 챗봇이 제안할 때 사용) */
export interface SuggestedRecipe {
  id: number;
  title: string;
  categoryId: number;
  categoryName: string;
  /** 대표 이미지 URL (없으면 null) */
  imageUrl?: string | null;
}

// ─── 대화 REST 응답 ────────────────────────────────────────────────────────────

/** 대화 목록 1건 */
export interface ConversationListItem {
  conversationId: string;
  /** 대화 제목 (메타). 없으면 null — UI는 첫 사용자 메시지 등으로 보조 표시 가능 */
  title: string | null;
  /** 대화 메타 최종 갱신 시각 (ISO 8601) */
  updatedAt: string;
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
  /** assistant 메시지에 저장된 추천 레시피 요약 (없으면 null) */
  suggestedRecipes: SuggestedRecipe[] | null;
  /** ISO 8601 */
  createdAt: string;
}

/** `GET /chatbot/conversations/:conversationId` 응답 (`ConversationHistory` 스키마) */
export interface ConversationHistory {
  conversationId: string;
  /** 대화 제목 (메타). 없으면 null */
  title: string | null;
  messages: ConversationMessage[];
}

// ─── SSE 스트림 이벤트 ────────────────────────────────────────────────────────

/** SSE 이벤트 `type` 판별자 union */
export const CHATBOT_STREAM_EVENT_TYPES = {
  CHUNK: 'chunk',
  DONE: 'done',
  ERROR: 'error',
  TOOL_CALL: 'tool_call',
} as const;

/** SSE 이벤트 `type` 판별자 union */
export type ChatbotStreamEventType =
  (typeof CHATBOT_STREAM_EVENT_TYPES)[keyof typeof CHATBOT_STREAM_EVENT_TYPES];

export const CHATBOT_TOOL_CALL_STATUS = {
  START: 'start',
  COMPLETE: 'complete',
} as const;

export type ChatbotToolCallStatus =
  (typeof CHATBOT_TOOL_CALL_STATUS)[keyof typeof CHATBOT_TOOL_CALL_STATUS];

/** 부분 텍스트 청크 */
export interface ChatbotStreamChunkEvent {
  type: typeof CHATBOT_STREAM_EVENT_TYPES.CHUNK;
  data: string;
}

/** 스트림 종료. 확정된 `conversationId`와 추천 레시피가 전달된다. */
export interface ChatbotStreamDoneEvent {
  type: typeof CHATBOT_STREAM_EVENT_TYPES.DONE;
  data: {
    conversationId: string;
    /** 최종 assistant 메시지 전체(선택). 청크만으로 구성된 경우와 중복될 수 있음 */
    message?: string;
    suggestedRecipes?: SuggestedRecipe[];
  };
}

/** 서버 측 에러. 클라이언트는 사용자에게 메시지 표시 후 스트림을 종료한다. */
export interface ChatbotStreamErrorEvent {
  type: typeof CHATBOT_STREAM_EVENT_TYPES.ERROR;
  data: { message: string };
}

/** Function Calling 진행 중 클라이언트 피드백용 (예: "레시피 검색 중…") */
export interface ChatbotStreamToolCallEvent {
  type: typeof CHATBOT_STREAM_EVENT_TYPES.TOOL_CALL;
  data: {
    functionName: string;
    status: ChatbotToolCallStatus;
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
