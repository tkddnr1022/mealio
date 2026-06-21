export const KAFKA_TOPICS = {
  CHATBOT_REQUESTS: 'chatbot-requests',
  ACTIVITY_EVENTS: 'activity-events',
  USER_EVENTS: 'user-events',
  CACHE_INVALIDATION: 'cache-invalidation',
  RECIPE_INGESTION_FETCH_COMPLETED: 'recipe-ingestion-fetch-completed',
  RECIPE_INGESTION_RETRIEVED: 'recipe-ingestion-retrieved',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];

export const KAFKA_DLQ_TOPICS = {
  CHATBOT_REQUESTS_DLQ: 'chatbot-requests-dlq',
  ACTIVITY_EVENTS_DLQ: 'activity-events-dlq',
  USER_EVENTS_DLQ: 'user-events-dlq',
  CACHE_INVALIDATION_DLQ: 'cache-invalidation-dlq',
  RECIPE_INGESTION_FETCH_COMPLETED_DLQ: 'recipe-ingestion-fetch-completed-dlq',
  RECIPE_INGESTION_RETRIEVED_DLQ: 'recipe-ingestion-retrieved-dlq',
} as const;

export type KafkaDlqTopic =
  (typeof KAFKA_DLQ_TOPICS)[keyof typeof KAFKA_DLQ_TOPICS];
