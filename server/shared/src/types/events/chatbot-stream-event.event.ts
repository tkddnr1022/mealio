/**
 * 챗봇 SSE 스트림 이벤트 타입
 * Consumer가 Redis 채널로 발행하는 메시지 형식 (Producer가 구독하여 클라이언트로 SSE 전달)
 */

export interface ChatbotStreamChunkEvent {
  type: 'chunk';
  data: string;
}

export interface ChatbotStreamDoneEvent {
  type: 'done';
  data: {
    conversationId: string;
    suggestedRecipes?: Array<{ id: number; title: string; matchScore: number }>;
  };
}

export interface ChatbotStreamErrorEvent {
  type: 'error';
  data: { message: string };
}

export type ChatbotStreamEvent =
  | ChatbotStreamChunkEvent
  | ChatbotStreamDoneEvent
  | ChatbotStreamErrorEvent;
