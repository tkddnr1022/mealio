import type { MongoosePoolConfig } from '@mealio/shared';

/**
 * Mongoose(MongoDB) 커넥션 풀 정책 (Producer).
 * URL·retry·readPreference 등은 shared MongooseSchemasModule에서 공용 관리한다.
 */
export const mongooseConnectionPoolConfig: MongoosePoolConfig = {
  maxPoolSize: 100,
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5_000,
  socketTimeoutMS: 45_000,
};
