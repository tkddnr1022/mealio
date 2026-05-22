/**
 * GA4 등 제품 분석용 이벤트 이름·props 키 상수.
 *
 * - 백엔드 EventLog/Kafka(조회수 API 등)와 역할이 겹치지 않도록 UI 인터랙션·퍼널만 계측한다.
 * - 호출부는 {@link trackEvent}와 함께 본 모듈의 상수만 사용한다.
 */
export const AnalyticsEvents = {
  RECIPE_VIEWED: 'recipe_viewed',
  RECIPE_SAVED: 'recipe_saved',
  RECIPE_UNSAVED: 'recipe_unsaved',
  CHATBOT_MESSAGE_SENT: 'chatbot_message_sent',
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

/** GA4 이벤트 params — snake_case, primitive 위주 */
export const AnalyticsEventProps = {
  RECIPE_ID: 'recipe_id',
  CONVERSATION_ID: 'conversation_id',
  MESSAGE_LENGTH: 'message_length',
  IS_NEW_CONVERSATION: 'is_new_conversation',
} as const;
