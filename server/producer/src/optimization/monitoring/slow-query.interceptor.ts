import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  getCorrelationId,
  logStructured,
  type ObservabilityConfig,
} from '@mealio/shared';
import { MetricsService, OBSERVABILITY_CONFIG } from './metrics.service';

/**
 * 슬로우 쿼리 감지·로깅·카운터 (Prisma/Mongoose 훅에서 호출).
 */
@Injectable()
export class SlowQueryMonitor {
  private readonly logger = new Logger(SlowQueryMonitor.name);

  constructor(
    private readonly metricsService: MetricsService,
    @Inject(OBSERVABILITY_CONFIG)
    private readonly observability: ObservabilityConfig,
  ) {}

  recordIfSlow(
    engine: 'prisma' | 'mongoose',
    operation: string,
    durationMs: number,
    detail?: Record<string, unknown>,
  ): void {
    const thresholdMs = this.observability.slowQueryThresholdMs;
    if (thresholdMs === undefined || durationMs < thresholdMs) {
      return;
    }

    this.metricsService.recordSlowQuery(engine, operation);

    logStructured(this.logger, 'warn', {
      event: 'slow_query',
      service: this.observability.serviceName,
      correlationId: getCorrelationId(),
      engine,
      operation,
      durationMs,
      thresholdMs,
      ...detail,
    });
  }
}
