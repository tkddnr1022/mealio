import type { PrismaPoolConfig } from '@mealio/shared';

/**
 * Prisma(PostgreSQL) 커넥션 풀 설정
 * - Producer 전용 최적화 설정
 * - 환경 변수 검증은 producer `env.validation.ts`에서 수행한다.
 */
export const prismaConnectionPoolConfig: PrismaPoolConfig = {
  // node-postgres Pool.max
  max: 20,
  // 커넥션 획득 타임아웃 (ms)
  connectionTimeoutMillis: 5_000,
  // idle 커넥션 유지 시간 (ms)
  idleTimeoutMillis: 30_000,
  // 커넥션 최대 수명 (초) - 0이면 제한 없음
  maxLifetimeSeconds: 0,
};
