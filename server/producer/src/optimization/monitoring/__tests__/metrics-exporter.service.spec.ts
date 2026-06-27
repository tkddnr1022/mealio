import type { Server } from 'node:http';
import type { ObservabilityConfig } from '@mealio/shared';
import { MetricsExporterService } from '../metrics-exporter.service';
import { MetricsService, OBSERVABILITY_CONFIG } from '../metrics.service';

jest.mock('node:http', () => ({
  createServer: jest.fn(),
}));

import { createServer } from 'node:http';

describe('MetricsExporterService', () => {
  const enabledConfig: ObservabilityConfig = {
    serviceName: 'producer',
    metricsEnabled: true,
    metricsPort: 9100,
    slowQueryThresholdMs: 500,
  };

  const disabledConfig: ObservabilityConfig = {
    ...enabledConfig,
    metricsEnabled: false,
  };

  let listenCallback: (() => void) | undefined;
  let requestHandler: (
    req: { url?: string },
    res: {
      statusCode: number;
      setHeader: jest.Mock;
      end: jest.Mock;
    },
  ) => void;

  beforeEach(() => {
    listenCallback = undefined;
    requestHandler = jest.fn();

    (createServer as jest.Mock).mockImplementation((handler) => {
      requestHandler = handler;
      return {
        listen: jest.fn((_port: number, cb: () => void) => {
          listenCallback = cb;
        }),
        close: jest.fn(),
      } as unknown as Server;
    });
  });

  it('should not start server when metrics disabled', () => {
    const service = new MetricsExporterService(
      new MetricsService(disabledConfig),
      disabledConfig,
    );

    service.onModuleInit();

    expect(createServer).not.toHaveBeenCalled();
  });

  it('should expose /metrics on METRICS_PORT when enabled', async () => {
    const metrics = new MetricsService(enabledConfig);
    metrics.onModuleInit();
    metrics.recordHttpRequest('GET', '/api/v1/recipes', 200, 1);

    const exporter = new MetricsExporterService(metrics, enabledConfig);
    exporter.onModuleInit();
    listenCallback?.();

    const res = {
      statusCode: 0,
      setHeader: jest.fn(),
      end: jest.fn(),
    };

    await requestHandler({ url: '/metrics' }, res);

    await new Promise((resolve) => setImmediate(resolve));

    expect(res.statusCode).toBe(200);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      metrics.getContentType(),
    );
    expect(res.end).toHaveBeenCalledWith(
      expect.stringContaining('http_requests_total'),
    );
  });

  it('should return 404 for non-metrics paths', () => {
    const exporter = new MetricsExporterService(
      new MetricsService(enabledConfig),
      enabledConfig,
    );
    exporter.onModuleInit();

    const res = {
      statusCode: 0,
      setHeader: jest.fn(),
      end: jest.fn(),
    };

    requestHandler({ url: '/health' }, res);

    expect(res.statusCode).toBe(404);
    expect(res.end).toHaveBeenCalledWith('Not Found');
  });
});
