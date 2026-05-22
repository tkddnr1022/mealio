import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from './generated/client';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PRISMA_POOL_CONFIG,
  type PrismaPoolConfig,
} from './prisma-pool.config';
import { isMetricsEnabledFromEnv } from '../../configs/observability.config';

/**
 * Prisma 서비스 (Producer/Consumer 공용)
 * - 커넥션 풀 설정은 애플리케이션별 DI 토큰(PRISMA_PG_CONFIG)으로 주입한다.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(@Inject(PRISMA_POOL_CONFIG) config: PrismaPoolConfig) {
    const adapter = new PrismaPg({
      connectionString: process.env.POSTGRESQL_URL!,
      ...config,
    });
    const metricsEnabled = isMetricsEnabledFromEnv();
    super({
      adapter,
      ...(metricsEnabled
        ? { log: [{ emit: 'event', level: 'query' as const }] }
        : {}),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
