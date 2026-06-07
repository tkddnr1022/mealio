/**
 * Sentry SDK 초기화 옵션 (런타임 파생).
 *
 * `initSentry`의 단일 진입점. DSN은 {@link ObservabilityConfig}에서만 읽는다.
 * 그 외 모든 Sentry 옵션·샘플링 비율은 본 파일 상수가 SSOT이다.
 */
import type { NodeOptions } from '@sentry/node';

import type { ObservabilityServiceName } from './observability.config';
import { isSentryEnabledEnv } from './observability.env-validation';

/** HTTP·Kafka 트레이스 경로 매칭용 (tracesSampler) */
export const SENTRY_BACKEND_TRACE_PATH = {
  HEALTH: '/health',
  METRICS: '/metrics',
} as const;

/** 모든 서비스 공통 init 옵션 */
export const SENTRY_BACKEND_COMMON = {
  sendDefaultPii: false,
} as const;

/** Production 샘플링 (에러·프로파일·트레이스) */
export const SENTRY_BACKEND_SAMPLING_PRODUCTION = {
  sampleRate: 1.0,
  profilesSampleRate: 0.2,
  traces: {
    /** transaction name 없음 */
    unnamed: 0.1,
    /** {@link SENTRY_BACKEND_TRACE_PATH.HEALTH} */
    health: 0,
    /** {@link SENTRY_BACKEND_TRACE_PATH.METRICS} */
    metrics: 0,
    /** 그 외 HTTP·Kafka span */
    default: 0.1,
  },
} as const;

/** Development 샘플링 */
export const SENTRY_BACKEND_SAMPLING_DEVELOPMENT = {
  sampleRate: 1.0,
  profilesSampleRate: 1.0,
  traces: {
    unnamed: 0.1,
    health: 0,
    metrics: 0,
    default: 1.0,
  },
} as const;

export function isProductionRuntime(): boolean {
  return (process.env.NODE_ENV ?? 'development') === 'production';
}

/** `initSentry` 전용 — SENTRY_ENABLED env와 DSN으로 SDK enabled 플래그를 계산한다. */
export function resolveBackendSentryEnabled(dsn?: string): boolean {
  return (
    isSentryEnabledEnv(process.env.SENTRY_ENABLED) &&
    Boolean(dsn && dsn.length > 0)
  );
}

function getTraceSamplingRates() {
  return isProductionRuntime()
    ? SENTRY_BACKEND_SAMPLING_PRODUCTION.traces
    : SENTRY_BACKEND_SAMPLING_DEVELOPMENT.traces;
}

function getEventSamplingRates() {
  return isProductionRuntime()
    ? SENTRY_BACKEND_SAMPLING_PRODUCTION
    : SENTRY_BACKEND_SAMPLING_DEVELOPMENT;
}

/**
 * HTTP·Kafka 트레이스 샘플링. health/metrics 프로브는 제외한다.
 */
export function createBackendTracesSampler(): NonNullable<
  NodeOptions['tracesSampler']
> {
  const rates = getTraceSamplingRates();

  return ({ name }) => {
    if (!name) {
      return rates.unnamed;
    }

    if (name.includes(SENTRY_BACKEND_TRACE_PATH.HEALTH)) {
      return rates.health;
    }

    if (name.includes(SENTRY_BACKEND_TRACE_PATH.METRICS)) {
      return rates.metrics;
    }

    return rates.default;
  };
}

export function getSentryInitOptions(
  serviceTag: ObservabilityServiceName,
  dsn: string,
  enabled: boolean,
): NodeOptions {
  const rates = getEventSamplingRates();

  return {
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE,
    enabled,
    sampleRate: rates.sampleRate,
    tracesSampler: createBackendTracesSampler(),
    profilesSampleRate: rates.profilesSampleRate,
    sendDefaultPii: SENTRY_BACKEND_COMMON.sendDefaultPii,
    initialScope: {
      tags: { service: serviceTag },
    },
  };
}
