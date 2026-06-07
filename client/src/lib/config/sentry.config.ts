/**
 * Sentry SDK 초기화 옵션 (env·런타임 파생).
 *
 * `instrumentation-client.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`의
 * 단일 진입점. DSN은 {@link env}에서, enabled는 `NEXT_PUBLIC_SENTRY_ENABLED` env에서 읽는다.
 * 그 외 모든 Sentry 옵션·샘플링 비율은 본 파일 상수가 SSOT이다.
 */
import type { BrowserOptions } from '@sentry/nextjs';

import { env } from '@/lib/config/env';

/** 이벤트·트레이스 경로 매칭용 (tracesSampler) */
export const SENTRY_CLIENT_TRACE_PATH = {
  API_HEALTH: '/api/health',
  API_METRICS: '/api/metrics',
  API_PREFIX: '/api/',
} as const;

/** 모든 런타임 공통 init 옵션 */
export const SENTRY_CLIENT_COMMON = {
  sendDefaultPii: false,
} as const;

/** Production 샘플링 (에러·프로파일·Replay·트레이스) */
export const SENTRY_CLIENT_SAMPLING_PRODUCTION = {
  sampleRate: 1.0,
  profilesSampleRate: 0.2,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  traces: {
    /** transaction name 없음 */
    unnamed: 0.1,
    /** {@link SENTRY_CLIENT_TRACE_PATH.API_HEALTH} */
    health: 0,
    /** {@link SENTRY_CLIENT_TRACE_PATH.API_METRICS} */
    metrics: 0,
    /** {@link SENTRY_CLIENT_TRACE_PATH.API_PREFIX} 이하 Route Handler */
    api: 0.2,
    /** 그 외 페이지·네비게이션 */
    page: 0.05,
  },
} as const;

/** Development 샘플링 */
export const SENTRY_CLIENT_SAMPLING_DEVELOPMENT = {
  sampleRate: 1.0,
  profilesSampleRate: 1.0,
  replaysSessionSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  traces: {
    unnamed: 0.1,
    health: 0,
    metrics: 0,
    api: 1.0,
    page: 1.0,
  },
} as const;

export type SentryRuntime = 'client' | 'server' | 'edge';

function parseClientSentryEnabledFlag(raw: string | undefined): boolean {
  if (raw === undefined) return false;
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return false;
}

/** `getSentryInitOptions` 전용 — NEXT_PUBLIC_SENTRY_ENABLED env와 DSN으로 enabled를 계산한다. */
export function resolveClientSentryEnabled(dsn?: string): boolean {
  return (
    parseClientSentryEnabledFlag(process.env.NEXT_PUBLIC_SENTRY_ENABLED) &&
    Boolean(dsn && dsn.length > 0)
  );
}

function getTraceSamplingRates() {
  return env.isProduction
    ? SENTRY_CLIENT_SAMPLING_PRODUCTION.traces
    : SENTRY_CLIENT_SAMPLING_DEVELOPMENT.traces;
}

function getEventSamplingRates() {
  return env.isProduction
    ? SENTRY_CLIENT_SAMPLING_PRODUCTION
    : SENTRY_CLIENT_SAMPLING_DEVELOPMENT;
}

/**
 * 브라우저·Next Route Handler 트레이스 샘플링.
 * health/metrics 노이즈는 0, API·페이지는 prod에서 낮게 샘플링한다.
 */
export function createClientTracesSampler(): NonNullable<
  BrowserOptions['tracesSampler']
> {
  const rates = getTraceSamplingRates();

  return ({ name }) => {
    if (!name) {
      return rates.unnamed;
    }

    if (name.includes(SENTRY_CLIENT_TRACE_PATH.API_HEALTH)) {
      return rates.health;
    }

    if (name.includes(SENTRY_CLIENT_TRACE_PATH.API_METRICS)) {
      return rates.metrics;
    }

    if (name.includes(SENTRY_CLIENT_TRACE_PATH.API_PREFIX)) {
      return rates.api;
    }

    return rates.page;
  };
}

export function getSentryInitOptions(
  serviceTag: string,
  runtime: SentryRuntime = 'server',
): BrowserOptions {
  const rates = getEventSamplingRates();

  const base: BrowserOptions = {
    dsn: env.sentryDsn,
    environment: env.runtime,
    enabled: resolveClientSentryEnabled(env.sentryDsn),
    sampleRate: rates.sampleRate,
    tracesSampler: createClientTracesSampler(),
    profilesSampleRate: rates.profilesSampleRate,
    sendDefaultPii: SENTRY_CLIENT_COMMON.sendDefaultPii,
    initialScope: {
      tags: { service: serviceTag },
    },
  };

  if (runtime === 'client') {
    return {
      ...base,
      replaysSessionSampleRate: rates.replaysSessionSampleRate,
      replaysOnErrorSampleRate: rates.replaysOnErrorSampleRate,
    };
  }

  return base;
}
