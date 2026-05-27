import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@mealio/shared';
import { MetricsService } from './metrics.service';
import { SlowQueryMonitor } from './slow-query.interceptor';

type PrismaQueryEvent = {
  duration: number;
  query: string;
  target?: string;
};

@Injectable()
export class PrismaMetrics implements OnModuleInit {
  private readonly logger = new Logger(PrismaMetrics.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly metricsService: MetricsService,
    private readonly slowQueryMonitor: SlowQueryMonitor,
  ) {}

  onModuleInit(): void {
    if (!this.metricsService.enabled) {
      return;
    }

    const client = this.prisma as PrismaService & {
      $on?: (
        event: 'query',
        callback: (event: PrismaQueryEvent) => void,
      ) => void;
    };

    if (typeof client.$on !== 'function') {
      this.logger.warn(
        'Prisma $on(query) is unavailable; enable log emit event in PrismaClient or upgrade client',
      );
      return;
    }

    client.$on('query', (event: PrismaQueryEvent) => {
      const durationMs = event.duration;
      const operation = inferPrismaOperation(event.query);
      this.metricsService.recordDbQuery('prisma', operation, durationMs);
      this.slowQueryMonitor.recordIfSlow('prisma', operation, durationMs, {
        target: event.target,
      });
    });
  }
}

function inferPrismaOperation(query: string): string {
  const match = query
    .trim()
    .match(/^(SELECT|INSERT|UPDATE|DELETE|BEGIN|COMMIT)/i);
  return match?.[1]?.toUpperCase() ?? 'QUERY';
}
