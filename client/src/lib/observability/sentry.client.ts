'use client';

import * as Sentry from '@sentry/browser';

import { env } from '@/lib/config/env';
import type { LogContext, LogLevel, LogSink } from '@/lib/utils/logger';

const SENTRY_TAG_SERVICE = 'service';
const SENTRY_TAG_CORRELATION_ID = 'correlationId';
const REDACTED = '[Filtered]';

let initialized = false;

function scrubContext(context: LogContext): LogContext {
  const out: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    const lower = key.toLowerCase();
    if (
      lower.includes('token') ||
      lower.includes('password') ||
      lower.includes('secret') ||
      lower.includes('authorization')
    ) {
      out[key] = REDACTED;
    } else {
      out[key] = value;
    }
  }
  return out;
}

function getClientSampleRate(): number {
  const raw = process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;
  if (!raw) return env.isProduction ? 0.1 : 1;
  const parsed = parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) return 0.1;
  return parsed;
}

/**
 * 브라우저 Sentry SDK 초기화. DSN이 없으면 no-op.
 */
export function initClientSentry(): boolean {
  if (initialized || typeof window === 'undefined') {
    return initialized;
  }
  const dsn = env.sentryDsn;
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment: env.runtime,
    tracesSampleRate: getClientSampleRate(),
    beforeSend(event) {
      if (event.request?.headers) {
        const headers = { ...event.request.headers };
        for (const key of Object.keys(headers)) {
          if (
            key.toLowerCase() === 'authorization' ||
            key.toLowerCase() === 'cookie'
          ) {
            headers[key] = REDACTED;
          }
        }
        event.request.headers = headers;
      }
      return event;
    },
  });

  Sentry.setTag(SENTRY_TAG_SERVICE, 'client');
  initialized = true;
  return true;
}

export function isClientSentryEnabled(): boolean {
  return initialized && Boolean(env.sentryDsn);
}

/**
 * logger {@link setLogSink}용 — warn/error 및 correlationId 태깅.
 */
export function createSentryLogSink(): LogSink {
  return (level: LogLevel, message: string, context?: LogContext) => {
    if (!isClientSentryEnabled()) return;
    if (level !== 'warn' && level !== 'error') return;

    const correlationId =
      typeof context?.correlationId === 'string'
        ? context.correlationId
        : undefined;

    Sentry.withScope((scope) => {
      scope.setTag(SENTRY_TAG_SERVICE, 'client');
      if (correlationId) {
        scope.setTag(SENTRY_TAG_CORRELATION_ID, correlationId);
      }
      if (context) {
        scope.setContext('log', scrubContext(context));
      }

      const err = context?.error;
      if (level === 'error' && err instanceof Error) {
        Sentry.captureException(err);
        return;
      }

      Sentry.captureMessage(
        message,
        level === 'error' ? 'error' : 'warning',
      );
    });
  };
}

/**
 * ApiError 등에서 correlationId를 Sentry 태그로 설정한다.
 */
export function setSentryCorrelationTag(correlationId?: string): void {
  if (!isClientSentryEnabled() || !correlationId) return;
  Sentry.setTag(SENTRY_TAG_CORRELATION_ID, correlationId);
}
