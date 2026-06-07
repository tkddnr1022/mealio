import { ConsumerMetricsService } from '../consumer-metrics.service';
import type { ObservabilityConfig } from '@mealio/shared';

describe('ConsumerMetricsService', () => {
  const config: ObservabilityConfig = {
    serviceName: 'consumer',
    metricsEnabled: true,
    metricsPort: 9091,
    slowQueryThresholdMs: 500,
  };

  it('should record processed and failed message metrics', async () => {
    const service = new ConsumerMetricsService(config);
    service.onModuleInit();
    service.recordProcessed('user-events', 'user-events-group', 42);
    service.recordFailed('user-events', 'user-events-group');
    service.setLag('user-events', 0, 'user-events-group', 3);

    const output = await service.getMetrics();
    expect(output).toContain('kafka_messages_processed_total');
    expect(output).toContain('kafka_messages_failed_total');
    expect(output).toContain('kafka_consumer_lag');
  });
});
