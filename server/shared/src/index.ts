/**
 * @mealio/shared - Producer/Consumer 공용 패키지
 * Configs, constants, database (Prisma/Mongoose), Redis, types
 */

// Config
export { createRedisConfig } from './config/redis.config';
export { createKafkaConfig, LOCAL_TOPIC_CONFIG } from './config/kafka.config';
export {
  createObservabilityConfig,
  isMetricsEnabledFromEnv,
  sentryDsnEnvName,
  SENTRY_DSN_ENV,
  CORRELATION_ID_HEADER,
  type ObservabilityConfig,
  type ObservabilityServiceName,
} from './config/observability.config';
export {
  createBackendTracesSampler,
  getSentryInitOptions,
  isProductionRuntime,
  resolveBackendSentryEnabled,
} from './config/sentry.config';
export {
  buildObservabilityEnvRules,
  isMetricsEnabledEnv,
  isSentryEnabledEnv,
} from './config/observability.env-validation';

// Observability utilities
export {
  runWithCorrelationId,
  getCorrelationId,
} from './utils/correlation-context';
export {
  generateCorrelationId,
  extractCorrelationIdFromKafkaHeaders,
} from './utils/correlation-id';
export {
  formatStructuredLog,
  logStructured,
  type StructuredLogFields,
  type StructuredLogLevel,
} from './utils/structured-logger';
export {
  RECIPE_NUTRITION_FIELD_KEYS,
  parseRecipeNutritionValue,
  parseRecipeNutrition,
  isRecipeNutritionPayload,
  compactRecipeNutritionForJson,
  formatRecipeNutritionSummary,
  formatNutritionSummary,
  type RecipeNutritionField,
  type RecipeNutrition,
  type RecipeNutritionPayload,
  type RecipeNutritionFormatLocale,
} from './utils/recipe-nutrition';

// Sentry (Phase C)
export {
  SENTRY_TAG_SERVICE,
  SENTRY_TAG_CORRELATION_ID,
  SENTRY_TAG_FEATURE,
  SENTRY_TAG_TOPIC,
  SENTRY_TAG_CONSUMER_GROUP,
  SENTRY_TAG_PARTITION,
  SENTRY_TAG_OFFSET,
  SENTRY_SENSITIVE_KEY_PATTERNS,
  SENTRY_SENSITIVE_HEADERS,
  type SentryServiceTag,
  type SentryFeatureTag,
} from './constants/sentry.constants';
export { scrubObject, scrubSentryEvent } from './observability/sentry-scrub';
export {
  inferFeatureFromHttpPath,
  inferFeatureFromKafkaTopic,
} from './observability/sentry-feature';
export {
  initSentry,
  captureSentryException,
  captureSentryMessage,
  closeSentry,
  type SentryCaptureContext,
  type InitSentryOptions,
} from './observability/sentry';
export { httpIntegration } from '@sentry/node';

// Constants
export {
  KAFKA_TOPICS,
  type KafkaTopic,
  KAFKA_DLQ_TOPICS,
  type KafkaDlqTopic,
} from './constants/kafka-topics';
export {
  CHATBOT_STREAM_CHANNEL_PREFIX,
  getChatbotStreamChannel,
} from './constants/redis-channels';
export {
  CACHE_KEY_PREFIX,
  CACHE_KEY_SEGMENT,
  type CacheKeyPrefix,
  buildCacheKey,
  cacheKeyUserProfile,
  cacheKeyInventory,
  cacheKeyIngredientById,
  cacheKeyChatbotFoodCategories,
  cacheKeyRecipeIngestionFoodCategories,
  cacheKeyRateLimitApi,
  cacheKeyRecipeDetail,
  cacheKeyRecommendation,
  cacheKeyDedupeRecipeView,
  cacheKeyDedupeSearchClick,
  cacheKeyDedupeSearchQuery,
  cachePatternDedupe,
  cacheKeyRecipeCategories,
  cachePatternRecipeListAndSearch,
  cachePatternRecipeStaticIds,
  cachePatternRecipeInvalidation,
  cacheKeyIngredientCategories,
  cachePatternIngredientListAndSearch,
  cachePatternIngredientInvalidation,
} from './constants/cache-keys';
export { ASSET_URL_PREFIX } from './constants/asset-url-prefixes';
export {
  DEFAULT_USER_CREDIT_BALANCE,
  DEFAULT_USER_CREDIT_MONTHLY_LIMIT,
  TOKENS_PER_CREDIT,
  computeChatbotCreditCost,
} from './policy/user-credits.policy';
export {
  RECIPE_INGESTION_JOB_STATUSES,
  type RecipeIngestionJobStatus,
  type RecipeIngestionJobTimestampField,
  RECIPE_INGESTION_STATE_KEY,
  RECIPE_INGESTION_RECIPE_SOURCE,
  RECIPE_INGESTION_DEFAULT_RECIPE_CATEGORY_ID,
  RECIPE_INGESTION_DEFAULT_INGREDIENT_CATEGORY_ID,
  RECIPE_INGESTION_PARSE_CONFIDENCE_VALUES,
  type RecipeIngestionParseConfidence,
  isRecipeIngestionParseConfidence,
  meetsRecipeIngestionMinParseConfidence,
  recipeIngestionJobSortTimestampField,
} from './constants/recipe-ingestion';
export { MAX_RECOMMENDATION_ROWS } from './policy/recommendation.policy';
export { SLOW_QUERY_THRESHOLD_MS } from './policy/observability.policy';
export {
  MAX_RECIPE_INGESTION_RETRY_COUNT,
  RECIPE_INGESTION_RETRY_BASE_DELAY_MS,
  DEFAULT_RECIPE_FETCH_LIMIT,
  MAX_RECIPE_FETCH_LIMIT,
  DEFAULT_RECIPE_RETRY_FAILED_LIMIT,
  DEFAULT_RECIPE_INGESTION_RUN_ID_COUNT,
  MAX_RECIPE_INGESTION_RUN_ID_COUNT,
  RECIPE_INGESTION_CATEGORY_CACHE_TTL_SECONDS,
  RECIPE_INGESTION_DEFAULT_DIFFICULTY,
  RECIPE_INGESTION_DEFAULT_COOK_TIME_MINUTES,
  RECIPE_INGESTION_DIFFICULTY_MIN,
  RECIPE_INGESTION_DIFFICULTY_MAX,
  RECIPE_INGESTION_COOK_TIME_MIN,
  RECIPE_INGESTION_COOK_TIME_MAX,
  RECIPE_INGESTION_OPENAI_BATCH_MAX_TOKENS,
  RECIPE_INGESTION_OPENAI_BATCH_REASONING_EFFORT,
  RECIPE_INGESTION_OPENAI_BATCH_VERBOSITY,
  INGREDIENT_VECTOR_MATCH_THRESHOLD,
  RECIPE_INGESTION_MIN_PARSE_CONFIDENCE,
  RECIPE_INGESTION_MIN_PUBLISH_PARSE_CONFIDENCE,
} from './policy/recipe-ingestion.policy';

// Redis
export { RedisModule } from './redis/redis.module';
export { RedisService } from './redis/redis.service';

// Prisma
export { PrismaModule } from './database/prisma/prisma.module';
export { PrismaService } from './database/prisma/prisma.service';
export {
  PRISMA_POOL_CONFIG,
  type PrismaPoolConfig,
} from './database/prisma/prisma-pool.config';

// Mongoose
export { MongooseSchemasModule } from './database/mongoose/mongoose.module';
export type { MongoosePoolConfig } from './database/mongoose/mongoose-pool.config';
export {
  ChatbotConversation,
  ChatbotConversationSchema,
  ChatbotLog,
  ChatbotLogSchema,
  SuggestedRecipeSummary,
  EventLog,
  EventLogSchema,
  Inventory,
  InventorySchema,
  KpiRollup,
  KpiRollupSchema,
  RecipeIngestionJob,
  RecipeIngestionJobSchema,
  RecipeIngestionState,
  RecipeIngestionStateSchema,
} from './database/mongoose/schemas';
export type {
  ChatbotConversationDocument,
  ChatbotLogDocument,
  EventLogDocument,
  InventoryDocument,
  KpiRollupDocument,
  RecipeIngestionJobDocument,
  RecipeIngestionStateDocument,
} from './database/mongoose/schemas';

// Types / Events
export * from './types/events';
