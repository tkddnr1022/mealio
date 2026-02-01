/**
 * 챗봇 요청 이벤트 타입 정의
 */
export interface ChatbotRequestEvent {
  userId: number;
  message: string;
  conversationId?: string;
  sessionId?: string;
  streamChannelId?: string;
  timestamp: string;
}
