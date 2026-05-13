/**
 * 챗봇 SSE 스트림 이벤트 타입
 * Consumer가 Redis 채널로 발행하는 메시지 형식 (Producer가 구독하여 클라이언트로 SSE 전달)
 */

export const CHATBOT_STREAM_EVENT_TYPES = {
  CHUNK: 'chunk',
  DONE: 'done',
  ERROR: 'error',
  TOOL_CALL: 'tool_call',
} as const;

export type ChatbotStreamEventType =
  (typeof CHATBOT_STREAM_EVENT_TYPES)[keyof typeof CHATBOT_STREAM_EVENT_TYPES];

export const CHATBOT_TOOL_CALL_STATUS = {
  START: 'start',
  COMPLETE: 'complete',
} as const;

export type ChatbotToolCallStatus =
  (typeof CHATBOT_TOOL_CALL_STATUS)[keyof typeof CHATBOT_TOOL_CALL_STATUS];

export interface ChatbotStreamChunkEvent {
  type: typeof CHATBOT_STREAM_EVENT_TYPES.CHUNK;
  data: string;
}

export interface ChatbotStreamDoneEvent {
  type: typeof CHATBOT_STREAM_EVENT_TYPES.DONE;
  data: {
    conversationId: string;
    /** 차감 후 크레딧 잔액이 0 이하이면 true */
    isCreditDepleted: boolean;
    suggestedRecipes?: Array<unknown>;
  };
}

export interface ChatbotStreamErrorEvent {
  type: typeof CHATBOT_STREAM_EVENT_TYPES.ERROR;
  data: { message: string };
}

/** Function Calling 실행 중 클라이언트 피드백용 (예: "레시피 검색 중…") */
export interface ChatbotStreamToolCallEvent {
  type: typeof CHATBOT_STREAM_EVENT_TYPES.TOOL_CALL;
  data: {
    functionName: string;
    status: ChatbotToolCallStatus;
    arguments?: string;
  };
}

export type ChatbotStreamEvent =
  | ChatbotStreamChunkEvent
  | ChatbotStreamDoneEvent
  | ChatbotStreamErrorEvent
  | ChatbotStreamToolCallEvent;
