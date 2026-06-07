'use client';

import * as Sentry from '@sentry/nextjs';

import { isApiError } from '@/lib/api/error';
import { setSentryCorrelationTag } from './sentry.client';

export function reportApiErrorToSentry(error: unknown): void {
  if (!isApiError(error)) return;

  setSentryCorrelationTag(error.correlationId);

  if (error.status < 500) return;

  Sentry.captureException(error, {
    tags: {
      service: 'client',
      ...(error.correlationId ? { correlationId: error.correlationId } : {}),
    },
    extra: {
      status: error.status,
      code: error.code,
    },
  });
}
