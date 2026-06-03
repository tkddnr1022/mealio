import type { PrismaPoolConfig } from '@mealio/shared';

/**
 * Prisma(PostgreSQL) 커넥션 풀 정책 (Producer).
 * 환경 변수 검증은 `config/env.validation.ts`에서 수행한다.
 */
export const prismaConnectionPoolConfig: PrismaPoolConfig = {
  max: 20,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
  maxLifetimeSeconds: 0,
};
