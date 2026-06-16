import {
  createObservabilityConfig,
  isMetricsEnabledFromEnv,
  resolveBackendSentryEnabled,
  SLOW_QUERY_THRESHOLD_MS,
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

    const config = createObservabilityConfig('producer', {
      requireMetricsPort: false,
    });

    expect(config.metricsEnabled).toBe(false);
    expect(config.slowQueryThresholdMs).toBeUndefined();
  });

  it('should read SENTRY_DSN_PRODUCER for producer', () => {
    process.env.METRICS_ENABLED = 'false';
    process.env.SENTRY_DSN_PRODUCER = 'https://example@o0.ingest.sentry.io/1';

    const config = createObservabilityConfig('producer', {
      requireMetricsPort: false,
    });

    expect(config.sentryDsn).toBe('https://example@o0.ingest.sentry.io/1');
  });

  it('should read SENTRY_DSN_CONSUMER for consumer', () => {
    process.env.METRICS_ENABLED = 'false';
    process.env.SENTRY_DSN_CONSUMER = 'https://example@o0.ingest.sentry.io/2';

    const config = createObservabilityConfig('consumer', {
      requireMetricsPort: false,
    });

    expect(config.sentryDsn).toBe('https://example@o0.ingest.sentry.io/2');
  });

  it('should parse producer observability vars when METRICS_ENABLED=true', () => {
    process.env.METRICS_ENABLED = 'true';

    const config = createObservabilityConfig('producer', {
      requireMetricsPort: false,
    });

    expect(config.metricsEnabled).toBe(true);
    expect(config.slowQueryThresholdMs).toBe(SLOW_QUERY_THRESHOLD_MS);
    expect(config.metricsPort).toBeUndefined();
  });

  it('should require METRICS_PORT for consumer when METRICS_ENABLED=true', () => {
    process.env.METRICS_ENABLED = 'true';
    process.env.METRICS_PORT = '9091';

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
