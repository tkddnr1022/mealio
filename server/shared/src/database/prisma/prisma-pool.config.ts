/**
 * Prisma + PostgreSQL 어댑터용 커넥션 풀 설정 타입 및 DI 토큰
 */

export interface PrismaPoolConfig {
  /**
   * 최대 커넥션 수 (node-postgres Pool.max)
   */
  max?: number;
  /**
   * 커넥션 획득 타임아웃 (ms)
   */
  connectionTimeoutMillis?: number;
  /**
   * idle 커넥션 유지 시간 (ms)
   */
  idleTimeoutMillis?: number;
  /**
   * 커넥션 최대 수명 (초)
   */
  maxLifetimeSeconds?: number;
}

export const PRISMA_POOL_CONFIG = 'PRISMA_POOL_CONFIG';
