/**
 * 챗봇 요청·이력 관련 이벤트 타입 정의.
 *
 * 1) Kafka `chatbot-requests` 토픽 페이로드 (Producer → Consumer)
 * 2) EventLog에 저장할 chatbot 이벤트 타입 (`chatbot.start`, `chatbot.message`)
 */

// 2) EventLog용 chatbot 이벤트 타입 (Producer가 요청 시점에 설정하여 발행)
export enum ChatbotEventType {
  START = 'chatbot.start',
  MESSAGE = 'chatbot.message',
}

export const CHATBOT_EVENT_TYPES: ChatbotEventType[] = [
  ...Object.values(ChatbotEventType),
];

// 1) Kafka chatbot-requests 토픽 페이로드
export interface ChatbotRequestEvent {
  userId: number;
  message: string;
  /** Producer가 요청 시점에 결정: 새 대화면 START, 이어쓰기면 MESSAGE */
  type: ChatbotEventType;
  conversationId?: string;
  streamChannelId?: string;
  timestamp: string;
}

export interface ChatbotStartEvent {
  type: ChatbotEventType.START;
  userId: number;
  conversationId?: string;
  streamChannelId?: string;
  timestamp: string;
}

export interface ChatbotMessageEvent {
  type: ChatbotEventType.MESSAGE;
  userId: number;
  conversationId?: string;
  streamChannelId?: string;
  timestamp: string;
}

export type ChatbotEvent = ChatbotStartEvent | ChatbotMessageEvent;
