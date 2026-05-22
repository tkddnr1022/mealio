import { Global, Module } from '@nestjs/common';
import { createObservabilityConfig } from '@mealio/shared';
import { MetricsService, OBSERVABILITY_CONFIG } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { HttpMetricsMiddleware } from './http-metrics.middleware';
import { PrismaMetrics } from './prisma-metrics';
import { MongooseMetrics } from './mongoose-metrics';
import { SlowQueryMonitor } from './slow-query.interceptor';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [
    {
      provide: OBSERVABILITY_CONFIG,
      useFactory: () =>
        createObservabilityConfig('producer', { requireMetricsPort: false }),
    },
    MetricsService,
    SlowQueryMonitor,
    PrismaMetrics,
    MongooseMetrics,
    HttpMetricsMiddleware,
  ],
  exports: [
    MetricsService,
    SlowQueryMonitor,
    HttpMetricsMiddleware,
    OBSERVABILITY_CONFIG,
  ],
})
export class MonitoringModule {}
