/**
 * Producer/Consumer 공통 관측(Observability) 설정
 * Sentry, 메트릭, 슬로우 쿼리 임계값 등을 한곳에서 로드한다.
 *
 * 기본값 없음 — METRICS_ENABLED 및 (활성 시) 관련 env는 Joi에서 검증한다.
 */

import { SLOW_QUERY_THRESHOLD_MS } from '../policy/observability.policy';
import { isMetricsEnabledEnv } from './observability.env-validation';

export type ObservabilityServiceName = 'producer' | 'consumer';

export const SENTRY_DSN_ENV: Record<ObservabilityServiceName, string> = {
  producer: 'SENTRY_DSN_PRODUCER',
  consumer: 'SENTRY_DSN_CONSUMER',
};

export function sentryDsnEnvName(
  serviceName: ObservabilityServiceName,
): string {
  return SENTRY_DSN_ENV[serviceName];
}

export interface ObservabilityConfig {
  serviceName: ObservabilityServiceName;
  sentryDsn?: string;
  metricsEnabled: boolean;
  metricsPort?: number;
  slowQueryThresholdMs?: number;
}

export const CORRELATION_ID_HEADER = 'x-correlation-id';

function parseBoolean(value: string): boolean {
  return value === 'true' || value === '1';
}

function parsePositiveInt(value: string, name: string): number {
  const parsed = parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`${name} is required`);
  }
  return value;
}

/**
 * 환경 변수에서 관측 설정을 생성한다.
 * METRICS_ENABLED=true 이면 Consumer의 METRICS_PORT가 반드시 설정되어 있어야 한다.
 * 슬로우 쿼리 임계값은 `observability.policy.ts`의 SLOW_QUERY_THRESHOLD_MS를 사용한다.
 *
 * @param serviceName 실행 중인 서비스 식별자
 * @param options.requireMetricsPort Consumer는 true
 */
export function createObservabilityConfig(
  serviceName: ObservabilityServiceName,
  options?: { requireMetricsPort?: boolean },
): ObservabilityConfig {
  const metricsEnabledRaw = readRequiredEnv('METRICS_ENABLED');
  const metricsEnabled = parseBoolean(metricsEnabledRaw);

  const sentryDsn = process.env[sentryDsnEnvName(serviceName)]?.trim();
  const normalizedSentryDsn =
    sentryDsn && sentryDsn.length > 0 ? sentryDsn : undefined;
  const base: ObservabilityConfig = {
    serviceName,
    sentryDsn: normalizedSentryDsn,
    metricsEnabled,
  };

  if (!metricsEnabled) {
    return base;
  }

  const requireMetricsPort =
    options?.requireMetricsPort ?? serviceName === 'consumer';

  return {
    ...base,
    ...(requireMetricsPort
      ? {
          metricsPort: parsePositiveInt(
            readRequiredEnv('METRICS_PORT'),
            'METRICS_PORT',
          ),
        }
      : {}),
    slowQueryThresholdMs: SLOW_QUERY_THRESHOLD_MS,
  };
}

/** @internal METRICS_ENABLED 파싱 (PrismaService 등 ConfigModule 외 사용처) */
export function isMetricsEnabledFromEnv(): boolean {
  return isMetricsEnabledEnv(process.env.METRICS_ENABLED);
}
