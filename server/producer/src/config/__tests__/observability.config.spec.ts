import {
  createObservabilityConfig,
  DEFAULT_SLOW_QUERY_THRESHOLD_MS,
} from '@mealio/shared';

describe('createObservabilityConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should apply defaults for producer', () => {
    delete process.env.SENTRY_DSN;
    delete process.env.METRICS_ENABLED;
    delete process.env.SLOW_QUERY_THRESHOLD_MS;

    const config = createObservabilityConfig('producer');

    expect(config.serviceName).toBe('producer');
    expect(config.metricsEnabled).toBe(false);
    expect(config.slowQueryThresholdMs).toBe(DEFAULT_SLOW_QUERY_THRESHOLD_MS);
    expect(config.sentryDsn).toBeUndefined();
  });

  it('should parse optional observability env vars', () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/1';
    process.env.METRICS_ENABLED = 'true';
    process.env.SLOW_QUERY_THRESHOLD_MS = '750';
    process.env.LOG_SAMPLE_RATE = '0.5';

    const config = createObservabilityConfig('consumer');

    expect(config.serviceName).toBe('consumer');
    expect(config.sentryDsn).toBe('https://example@sentry.io/1');
    expect(config.metricsEnabled).toBe(true);
    expect(config.slowQueryThresholdMs).toBe(750);
    expect(config.logSampleRate).toBe(0.5);
  });
});
