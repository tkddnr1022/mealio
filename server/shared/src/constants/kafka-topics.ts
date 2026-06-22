export const KAFKA_TOPICS = {
  CHATBOT_REQUESTS: 'chatbot-requests',
  ACTIVITY_EVENTS: 'activity-events',
  USER_EVENTS: 'user-events',
  CACHE_INVALIDATION: 'cache-invalidation',
  RECIPE_INGESTION_PARSE_SUBMIT_TRIGGERED:
    'recipe-ingestion-parse-submit-triggered',
  RECIPE_INGESTION_PERSIST_TRIGGERED: 'recipe-ingestion-persist-triggered',
  RECIPE_INGESTION_EMBED_SUBMIT_TRIGGERED:
    'recipe-ingestion-embed-submit-triggered',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];

export const KAFKA_DLQ_TOPICS = {
  CHATBOT_REQUESTS_DLQ: 'chatbot-requests-dlq',
  ACTIVITY_EVENTS_DLQ: 'activity-events-dlq',
  USER_EVENTS_DLQ: 'user-events-dlq',
  CACHE_INVALIDATION_DLQ: 'cache-invalidation-dlq',
  RECIPE_INGESTION_PARSE_SUBMIT_TRIGGERED_DLQ:
    'recipe-ingestion-parse-submit-triggered-dlq',
  RECIPE_INGESTION_PERSIST_TRIGGERED_DLQ:
    'recipe-ingestion-persist-triggered-dlq',
  RECIPE_INGESTION_EMBED_SUBMIT_TRIGGERED_DLQ:
    'recipe-ingestion-embed-submit-triggered-dlq',
} as const;

export type KafkaDlqTopic =
  (typeof KAFKA_DLQ_TOPICS)[keyof typeof KAFKA_DLQ_TOPICS];
