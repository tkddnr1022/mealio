/**
 * @cook/shared - Producer/Consumer 공용 패키지
 * Configs, constants, database (Prisma/Mongoose), Redis, types
 */

// Configs
export { createRedisConfig } from './configs/redis.config';
export { createKafkaConfig, LOCAL_TOPIC_CONFIG } from './configs/kafka.config';
export { mongooseConfig } from './configs/mongoose.config';

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
export { CACHE_KEY_PREFIX } from './constants/cache-keys';

// Redis
export { RedisModule } from './redis/redis.module';
export { RedisService } from './redis/redis.service';

// Prisma
export { PrismaModule } from './database/prisma/prisma.module';
export { PrismaService } from './database/prisma/prisma.service';

// Mongoose schemas
export {
  ChatbotLog,
  ChatbotLogSchema,
  EventLog,
  EventLogSchema,
  UserIngredient,
  UserIngredientSchema,
} from './database/mongoose/schemas';
export type {
  ChatbotLogDocument,
  EventLogDocument,
  UserIngredientDocument,
} from './database/mongoose/schemas';

// Types / Events
export * from './types/events';
