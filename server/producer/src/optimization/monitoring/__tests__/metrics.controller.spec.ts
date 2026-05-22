import { ServiceUnavailableException } from '@nestjs/common';
import { MetricsController } from '../metrics.controller';
import { MetricsService } from '../metrics.service';
import type { ObservabilityConfig } from '@mealio/shared';

describe('MetricsController', () => {
  const enabledConfig: ObservabilityConfig = {
    serviceName: 'producer',
    metricsEnabled: true,
    metricsPort: 9091,
    slowQueryThresholdMs: 500,
    logSampleRate: 1,
    traceSampleRate: 1,
  };

  const disabledConfig: ObservabilityConfig = {
    ...enabledConfig,
    metricsEnabled: false,
  };

  it('should return 503 when metrics disabled', async () => {
    const service = new MetricsService(disabledConfig);
    const controller = new MetricsController(service);
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    await expect(controller.getMetrics(res as never)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('should send metrics body when enabled', async () => {
    const service = new MetricsService(enabledConfig);
    service.onModuleInit();
    service.recordHttpRequest('GET', '/metrics', 200, 1);
    const controller = new MetricsController(service);
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    await controller.getMetrics(res as never);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      service.getContentType(),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining('http_requests_total'),
    );
  });
});
