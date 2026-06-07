import { EventEmitter } from 'events';
import { HttpMetricsMiddleware } from '../http-metrics.middleware';
import { MetricsService } from '../metrics.service';
import type { ObservabilityConfig } from '@mealio/shared';

describe('HttpMetricsMiddleware', () => {
  const enabledConfig: ObservabilityConfig = {
    serviceName: 'producer',
    metricsEnabled: true,
    slowQueryThresholdMs: 500,
  };

  it('should not record metrics for /metrics', () => {
    const metricsService = new MetricsService(enabledConfig);
    metricsService.onModuleInit();
    const recordSpy = jest.spyOn(metricsService, 'recordHttpRequest');
    const incSpy = jest.spyOn(metricsService, 'incHttpInflight');

    const middleware = new HttpMetricsMiddleware(metricsService);
    const res = new EventEmitter() as EventEmitter & {
      statusCode: number;
      on: EventEmitter['on'];
    };
    res.statusCode = 200;
    const next = jest.fn();

    middleware.use(
      {
        method: 'GET',
        path: '/',
        originalUrl: '/metrics',
        url: '/metrics',
      } as never,
      res as never,
      next,
    );
    res.emit('finish');

    expect(next).toHaveBeenCalled();
    expect(incSpy).not.toHaveBeenCalled();
    expect(recordSpy).not.toHaveBeenCalled();

    recordSpy.mockRestore();
    incSpy.mockRestore();
  });
});
