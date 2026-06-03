import type { MongoosePoolConfig } from '@mealio/shared';

/**
 * Mongoose(MongoDB) 커넥션 풀 정책 (Consumer).
 * URL·retry·readPreference 등은 shared MongooseSchemasModule에서 공용 관리한다.
 */
export const mongooseConnectionPoolConfig: MongoosePoolConfig = {
  maxPoolSize: 50,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5_000,
  socketTimeoutMS: 45_000,
};
