// TODO: shared 모듈을 공용 라이브러리로 구축
export const KAFKA_TOPICS = {
  RECIPE_GENERATION: 'recipe-generation',
  CHATBOT_REQUESTS: 'chatbot-requests',
  SEARCH_LOGS: 'search-logs',
  USER_EVENTS: 'user-events',
  CACHE_INVALIDATION: 'cache-invalidation',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];

