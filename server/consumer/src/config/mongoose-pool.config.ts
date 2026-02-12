import type { MongoosePoolConfig } from '@cook/shared';

/**
 * Mongoose(MongoDB) 커넥션 풀 설정 (Consumer 전용)
 * - URL·retry·readPreference 등은 shared MongooseSchemasModule에서 공용 관리
 */
export const mongooseConnectionPoolConfig: MongoosePoolConfig = {
  maxPoolSize: 50,
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5_000,
  socketTimeoutMS: 45_000,
};
