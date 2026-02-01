/**
 * @cook/shared - Producer/Consumer 공용 패키지
 * Configs, constants, database (Prisma/Mongoose), Redis, types
 */

// Configs
export { createRedisConfig } from './configs/redis.config.js';
export { createKafkaConfig, LOCAL_TOPIC_CONFIG } from './configs/kafka.config.js';
export { mongooseConfig } from './configs/mongoose.config.js';

// Constants
export { KAFKA_TOPICS, type KafkaTopic } from './constants/kafka-topics.js';
export {
  CHATBOT_STREAM_CHANNEL_PREFIX,
  getChatbotStreamChannel,
} from './constants/redis-channels.js';

// Redis
export { RedisModule } from './redis/redis.module.js';
export { RedisService } from './redis/redis.service.js';

// Prisma
export { PrismaModule } from './database/prisma/prisma.module.js';
export { PrismaService } from './database/prisma/prisma.service.js';

// Mongoose schemas
export {
  ChatbotLog,
  ChatbotLogSchema,
  EventLog,
  EventLogSchema,
  UserIngredient,
  UserIngredientSchema,
} from './database/mongoose/schemas/index.js';
export type {
  ChatbotLogDocument,
  EventLogDocument,
  UserIngredientDocument,
} from './database/mongoose/schemas/index.js';

// Types / Events
export * from './types/events/index.js';
