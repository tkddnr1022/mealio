/**
 * 챗봇 요청 이벤트 타입 정의
 * Kafka CHATBOT_REQUESTS 토픽에서 사용 (Producer는 발행만, Consumer에서 GPT 호출·ChatbotLog 저장)
 */

export interface ChatbotRequestEvent {
  userId: number;
  message: string;
  conversationId?: string;
  sessionId?: string;
  timestamp: string;
}
