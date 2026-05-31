/**
 * Kafka consumer 그룹 ID 상수.
 * 환경 변수가 아닌 상수로 관리하여 그룹별 역할이 명확하도록 한다.
 */
export const CONSUMER_GROUPS = {
  CHATBOT: 'chatbot-group',
  USER_EVENTS: 'user-events-group',
  ACTIVITY_EVENTS: 'activity-events-group',
  CACHE_INVALIDATION: 'cache-invalidation-group',
  RECIPE_INGESTION_PERSIST: 'recipe-ingestion-persist-group',
} as const;

export type ConsumerGroupId =
  (typeof CONSUMER_GROUPS)[keyof typeof CONSUMER_GROUPS];
