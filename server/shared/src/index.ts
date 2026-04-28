/**
 * @cook/shared - Producer/Consumer 공용 패키지
 * Configs, constants, database (Prisma/Mongoose), Redis, types
 */

// Configs
export { createRedisConfig } from './configs/redis.config';
export { createKafkaConfig, LOCAL_TOPIC_CONFIG } from './configs/kafka.config';

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
  cacheKeyRateLimitApi,
  cacheKeyRecipeDetail,
  cachePatternRecipeListAndSearch,
} from './constants/cache-keys';
export { ASSET_URL_PREFIX } from './constants/asset-url-prefixes';

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
  ChatbotLog,
  ChatbotLogSchema,
  EventLog,
  EventLogSchema,
  Inventory,
  InventorySchema,
} from './database/mongoose/schemas';
export type {
  ChatbotLogDocument,
  EventLogDocument,
  InventoryDocument,
} from './database/mongoose/schemas';

// Types / Events
export * from './types/events';
