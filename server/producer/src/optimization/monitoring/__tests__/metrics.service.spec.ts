import { MetricsService, OBSERVABILITY_CONFIG } from '../metrics.service';
import type { ObservabilityConfig } from '@mealio/shared';

describe('MetricsService', () => {
  const enabledConfig: ObservabilityConfig = {
    serviceName: 'producer',
    metricsEnabled: true,
    metricsPort: 9091,
    slowQueryThresholdMs: 500,
  };

  const disabledConfig: ObservabilityConfig = {
    ...enabledConfig,
    metricsEnabled: false,
  };

  it('should expose prometheus metrics when enabled', async () => {
    const service = new MetricsService(enabledConfig);
    service.onModuleInit();
    service.recordHttpRequest('GET', '/health', 200, 12);
    service.recordRateLimitBlocked();

    const output = await service.getMetrics();
    expect(output).toContain('http_requests_total');
    expect(output).toContain('http_request_duration_ms');
    expect(output).toContain('rate_limit_blocked_total');
  });

  it('should not increment metrics when disabled', async () => {
    const service = new MetricsService(disabledConfig);
    service.recordHttpRequest('GET', '/health', 200, 12);

    const output = await service.getMetrics();
    expect(output).not.toContain('http_requests_total');
  });

  it('should use OBSERVABILITY_CONFIG injection token', () => {
    expect(OBSERVABILITY_CONFIG).toBe('OBSERVABILITY_CONFIG');
  });
});
