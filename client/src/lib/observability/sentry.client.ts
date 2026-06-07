'use client';

import * as Sentry from '@sentry/nextjs';

import { isApiError } from '@/lib/api/error';
import type { LogContext, LogLevel, LogSink } from '@/lib/utils/logger';

const SENTRY_TAG_SERVICE = 'service';
const SENTRY_TAG_CORRELATION_ID = 'correlationId';
const REDACTED = '[Filtered]';

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

export function createSentryLogSink(): LogSink {
  return (level: LogLevel, message: string, context?: LogContext) => {
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
        if (isApiError(err)) return;
        Sentry.captureException(err);
        return;
      }

      Sentry.captureMessage(message, level === 'error' ? 'error' : 'warning');
    });
  };
}

/**
 * ApiError 등에서 correlationId를 Sentry 태그로 설정한다.
 */
export function setSentryCorrelationTag(correlationId?: string): void {
  if (!correlationId) return;
  Sentry.setTag(SENTRY_TAG_CORRELATION_ID, correlationId);
}
