import {
  createObservabilityConfig,
  isMetricsEnabledFromEnv,
} from '@mealio/shared';

describe('createObservabilityConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return metrics-disabled config when METRICS_ENABLED=false', () => {
    process.env.METRICS_ENABLED = 'false';
    delete process.env.SLOW_QUERY_THRESHOLD_MS;

    const config = createObservabilityConfig('producer', {
      requireMetricsPort: false,
    });

    expect(config.metricsEnabled).toBe(false);
    expect(config.slowQueryThresholdMs).toBeUndefined();
  });

  it('should parse producer observability vars when METRICS_ENABLED=true', () => {
    process.env.METRICS_ENABLED = 'true';
    process.env.SLOW_QUERY_THRESHOLD_MS = '750';
    process.env.LOG_SAMPLE_RATE = '0.5';
    process.env.TRACE_SAMPLE_RATE = '1';

    const config = createObservabilityConfig('producer', {
      requireMetricsPort: false,
    });

    expect(config.metricsEnabled).toBe(true);
    expect(config.slowQueryThresholdMs).toBe(750);
    expect(config.logSampleRate).toBe(0.5);
    expect(config.metricsPort).toBeUndefined();
  });

  it('should require METRICS_PORT for consumer when METRICS_ENABLED=true', () => {
    process.env.METRICS_ENABLED = 'true';
    process.env.METRICS_PORT = '9091';
    process.env.SLOW_QUERY_THRESHOLD_MS = '500';
    process.env.LOG_SAMPLE_RATE = '1';
    process.env.TRACE_SAMPLE_RATE = '1';

    const config = createObservabilityConfig('consumer', {
      requireMetricsPort: true,
    });

    expect(config.metricsPort).toBe(9091);
  });

  it('should throw when METRICS_ENABLED is missing', () => {
    delete process.env.METRICS_ENABLED;

    expect(() => createObservabilityConfig('producer')).toThrow(
      'METRICS_ENABLED is required',
    );
  });

  it('isMetricsEnabledFromEnv should read METRICS_ENABLED', () => {
    process.env.METRICS_ENABLED = '1';
    expect(isMetricsEnabledFromEnv()).toBe(true);
    process.env.METRICS_ENABLED = 'false';
    expect(isMetricsEnabledFromEnv()).toBe(false);
  });
});
