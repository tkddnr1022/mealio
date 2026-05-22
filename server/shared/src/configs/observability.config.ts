/**
 * Producer/Consumer 공통 관측(Observability) 설정
 * Sentry, 메트릭, 슬로우 쿼리 임계값 등을 한곳에서 로드한다.
 */

export type ObservabilityServiceName = 'producer' | 'consumer';

export interface ObservabilityConfig {
  serviceName: ObservabilityServiceName;
  sentryDsn?: string;
  metricsEnabled: boolean;
  slowQueryThresholdMs: number;
  logSampleRate: number;
  traceSampleRate: number;
}

export const DEFAULT_SLOW_QUERY_THRESHOLD_MS = 500;
export const DEFAULT_LOG_SAMPLE_RATE = 1;
export const DEFAULT_TRACE_SAMPLE_RATE = 1;

export const CORRELATION_ID_HEADER = 'x-correlation-id';

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value === 'true' || value === '1';
}

function parsePositiveInt(
  value: string | undefined,
  defaultValue: number,
): number {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
}

function parseSampleRate(
  value: string | undefined,
  defaultValue: number,
): number {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return defaultValue;
  }
  return parsed;
}

/**
 * 환경 변수에서 관측 설정을 생성한다.
 *
 * @param serviceName 실행 중인 서비스 식별자
 */
export function createObservabilityConfig(
  serviceName: ObservabilityServiceName,
): ObservabilityConfig {
  const sentryDsn = process.env.SENTRY_DSN?.trim();
  return {
    serviceName,
    sentryDsn: sentryDsn && sentryDsn.length > 0 ? sentryDsn : undefined,
    metricsEnabled: parseBoolean(process.env.METRICS_ENABLED, false),
    slowQueryThresholdMs: parsePositiveInt(
      process.env.SLOW_QUERY_THRESHOLD_MS,
      DEFAULT_SLOW_QUERY_THRESHOLD_MS,
    ),
    logSampleRate: parseSampleRate(
      process.env.LOG_SAMPLE_RATE,
      DEFAULT_LOG_SAMPLE_RATE,
    ),
    traceSampleRate: parseSampleRate(
      process.env.TRACE_SAMPLE_RATE,
      DEFAULT_TRACE_SAMPLE_RATE,
    ),
  };
}
