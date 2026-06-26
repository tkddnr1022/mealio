import { Logger } from '@nestjs/common';
import { ConsumerMetricsService } from '../consumer-metrics.service';
import { pushCliMetrics } from '../metrics-push';

const pushAddMock = jest.fn();

jest.mock('prom-client', () => {
  const actual = jest.requireActual<typeof import('prom-client')>('prom-client');
  return {
    ...actual,
    Pushgateway: jest.fn().mockImplementation(() => ({
      pushAdd: pushAddMock,
    })),
  };
});

describe('pushCliMetrics', () => {
  const logger = {
    warn: jest.fn(),
  } as unknown as Logger;

  beforeEach(() => {
    jest.clearAllMocks();
    pushAddMock.mockResolvedValue(undefined);
  });

  it('should no-op when pushgatewayUrl is undefined', async () => {
    const metrics = new ConsumerMetricsService({
      serviceName: 'consumer',
      metricsEnabled: true,
      metricsPort: 9091,
    });

    await pushCliMetrics(metrics, undefined, 'fetch', logger);

    expect(pushAddMock).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should no-op when metrics are disabled', async () => {
    const metrics = new ConsumerMetricsService({
      serviceName: 'consumer',
      metricsEnabled: false,
    });

    await pushCliMetrics(metrics, 'http://localhost:9093', 'fetch', logger);

    expect(pushAddMock).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should push metrics to Pushgateway on success', async () => {
    const metrics = new ConsumerMetricsService({
      serviceName: 'consumer',
      metricsEnabled: true,
      metricsPort: 9091,
    });
    metrics.onModuleInit();
    metrics.recordIngestionStage('fetch', 'success', 3);

    await pushCliMetrics(
      metrics,
      'http://localhost:9093',
      'fetch',
      logger,
    );

    expect(pushAddMock).toHaveBeenCalledWith({
      jobName: 'recipe_ingestion_cli',
      groupings: { stage: 'fetch' },
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should warn and not throw when push fails', async () => {
    const metrics = new ConsumerMetricsService({
      serviceName: 'consumer',
      metricsEnabled: true,
      metricsPort: 9091,
    });
    pushAddMock.mockRejectedValue(new Error('connection refused'));

    await expect(
      pushCliMetrics(
        metrics,
        'http://localhost:9093',
        'parse-submit',
        logger,
      ),
    ).resolves.toBeUndefined();

    expect(logger.warn).toHaveBeenCalledWith(
      'Pushgateway push failed: Error: connection refused',
    );
  });
});
