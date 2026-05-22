import { Logger } from '@nestjs/common';
import { SlowQueryMonitor } from '../slow-query.interceptor';
import { MetricsService } from '../metrics.service';
import type { ObservabilityConfig } from '@mealio/shared';

describe('SlowQueryMonitor', () => {
  const config: ObservabilityConfig = {
    serviceName: 'producer',
    metricsEnabled: true,
    metricsPort: 9091,
    slowQueryThresholdMs: 100,
    logSampleRate: 1,
    traceSampleRate: 1,
  };

  let metrics: MetricsService;
  let monitor: SlowQueryMonitor;

  beforeEach(() => {
    metrics = new MetricsService(config);
    metrics.onModuleInit();
    monitor = new SlowQueryMonitor(metrics, config);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  it('should record slow query when duration exceeds threshold', async () => {
    monitor.recordIfSlow('prisma', 'SELECT', 250);

    const output = await metrics.getMetrics();
    expect(output).toContain('slow_queries_total');
  });

  it('should skip when duration is below threshold', async () => {
    monitor.recordIfSlow('mongoose', 'find', 50);

    const output = await metrics.getMetrics();
    expect(output).not.toMatch(/slow_queries_total\{[^}]+\}\s+[1-9]/);
  });
});
