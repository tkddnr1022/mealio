/**
 * 챗봇 요청 이벤트 타입 정의
 */
export interface ChatbotRequestEvent {
  userId: number;
  message: string;
  conversationId?: string;
  sessionId?: string;
  streamChannelId?: string;
  /** 사용자 재료함(보유 재료) ID 목록 */
  userIngredientIds?: number[];
  /** 즐겨찾기 재료 ID 목록 */
  favoriteIngredientIds?: number[];
  timestamp: string;
}
