/**
 * 챗봇 요청 이벤트 타입 정의
 * Kafka CHATBOT_REQUESTS 토픽에서 사용 (Producer는 발행만, Consumer에서 GPT 호출·ChatbotLog 저장)
 * SSE 스트리밍 시 Consumer가 streamChannelId 채널로 Redis에 청크/종료 메시지를 발행한다.
 */

export interface ChatbotRequestEvent {
  userId: number;
  message: string;
  conversationId?: string;
  sessionId?: string;
  /** SSE 스트리밍 시 Redis 채널 키(Producer가 구독, Consumer가 발행) */
  streamChannelId?: string;
  timestamp: string;
}
