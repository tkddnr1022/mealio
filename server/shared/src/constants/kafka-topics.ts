export const KAFKA_TOPICS = {
  RECIPE_GENERATION: 'recipe-generation',
  CHATBOT_REQUESTS: 'chatbot-requests',
  SEARCH_LOGS: 'search-logs',
  USER_EVENTS: 'user-events',
  CACHE_INVALIDATION: 'cache-invalidation',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];

export const KAFKA_DLQ_TOPICS = {
  CHATBOT_REQUESTS_DLQ: 'chatbot-requests-dlq',
} as const;

export type KafkaDlqTopic =
  (typeof KAFKA_DLQ_TOPICS)[keyof typeof KAFKA_DLQ_TOPICS];
