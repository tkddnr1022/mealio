'use client';

import * as Sentry from '@sentry/browser';

import { isApiError } from '@/lib/api/error';
import { isClientSentryEnabled, setSentryCorrelationTag } from './sentry.client';

/**
 * ApiError 발생 시 correlationId 태그 및 5xx 예외를 Sentry에 보고한다.
 */
export function reportApiErrorToSentry(error: unknown): void {
  if (!isClientSentryEnabled() || !isApiError(error)) return;

  setSentryCorrelationTag(error.correlationId);

  if (error.status < 500) return;

  Sentry.captureException(error, {
    tags: {
      service: 'client',
      ...(error.correlationId
        ? { correlationId: error.correlationId }
        : {}),
    },
    extra: {
      status: error.status,
      code: error.code,
    },
  });
}
