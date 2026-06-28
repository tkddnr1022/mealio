import {
  createObservabilityConfig,
  isMetricsEnabledFromEnv,
  resolveBackendSentryEnabled,
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

    const config = createObservabilityConfig('producer');

    expect(config.metricsEnabled).toBe(false);
    expect(config.slowQueryThresholdMs).toBeUndefined();
    expect(config.metricsPort).toBeUndefined();
  });

  it('should read SENTRY_DSN_PRODUCER for producer', () => {
    process.env.METRICS_ENABLED = 'false';
    process.env.SENTRY_DSN_PRODUCER = 'https://example@o0.ingest.sentry.io/1';

    const config = createObservabilityConfig('producer');

    expect(config.sentryDsn).toBe('https://example@o0.ingest.sentry.io/1');
  });

  it('should read SENTRY_DSN_CONSUMER for consumer', () => {
    process.env.METRICS_ENABLED = 'false';
    process.env.SENTRY_DSN_CONSUMER = 'https://example@o0.ingest.sentry.io/2';

    const config = createObservabilityConfig('consumer');

    expect(config.sentryDsn).toBe('https://example@o0.ingest.sentry.io/2');
  });

  it.each([
    ['producer', '9100'],
    ['consumer', '9101'],
  ] as const)(
    'should parse %s observability vars when METRICS_ENABLED=true',
    (serviceName, metricsPort) => {
      process.env.METRICS_ENABLED = 'true';
      process.env.METRICS_PORT = metricsPort;
      process.env.SLOW_QUERY_THRESHOLD_MS = '500';

      const config = createObservabilityConfig(serviceName);

      expect(config.metricsEnabled).toBe(true);
      expect(config.slowQueryThresholdMs).toBe(500);
      expect(config.metricsPort).toBe(Number(metricsPort));
    },
  );

  it('should read SLOW_QUERY_THRESHOLD_MS from env when METRICS_ENABLED=true', () => {
    process.env.METRICS_ENABLED = 'true';
    process.env.METRICS_PORT = '9100';
    process.env.SLOW_QUERY_THRESHOLD_MS = '750';

    const config = createObservabilityConfig('producer');

    expect(config.slowQueryThresholdMs).toBe(750);
  });

  it('should throw when SLOW_QUERY_THRESHOLD_MS is missing and METRICS_ENABLED=true', () => {
    process.env.METRICS_ENABLED = 'true';
    process.env.METRICS_PORT = '9100';
    delete process.env.SLOW_QUERY_THRESHOLD_MS;

    expect(() => createObservabilityConfig('producer')).toThrow(
      'SLOW_QUERY_THRESHOLD_MS is required',
    );
  });

  it('should throw when SLOW_QUERY_THRESHOLD_MS is invalid and METRICS_ENABLED=true', () => {
    process.env.METRICS_ENABLED = 'true';
    process.env.METRICS_PORT = '9100';
    process.env.SLOW_QUERY_THRESHOLD_MS = '0';

    expect(() => createObservabilityConfig('producer')).toThrow(
      'SLOW_QUERY_THRESHOLD_MS must be a positive integer',
    );
  });

  it('should throw when METRICS_PORT is missing and METRICS_ENABLED=true', () => {
    process.env.METRICS_ENABLED = 'true';
    delete process.env.METRICS_PORT;

    expect(() => createObservabilityConfig('producer')).toThrow(
      'METRICS_PORT is required',
    );
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

  it('resolveBackendSentryEnabled should require SENTRY_ENABLED=true and DSN', () => {
    process.env.SENTRY_ENABLED = 'true';
    expect(
      resolveBackendSentryEnabled('https://example@o0.ingest.sentry.io/1'),
    ).toBe(true);

    process.env.SENTRY_ENABLED = 'false';
    expect(
      resolveBackendSentryEnabled('https://example@o0.ingest.sentry.io/1'),
    ).toBe(false);

    process.env.SENTRY_ENABLED = 'true';
    expect(resolveBackendSentryEnabled(undefined)).toBe(false);
  });
});
