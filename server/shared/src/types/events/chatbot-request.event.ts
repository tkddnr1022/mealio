/**
 * 챗봇 요청 이벤트 타입 정의.
 * 도메인 데이터(유저 재료 등)는 Consumer에서 tool call(get_user_ingredients 등)로 조회한다.
 */
export interface ChatbotRequestEvent {
  userId: number;
  message: string;
  conversationId?: string;
  streamChannelId?: string;
  timestamp: string;
}
