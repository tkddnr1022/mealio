'use client';

import * as Sentry from '@sentry/browser';

import type { WebVitalName, WebVitalsReportPayload } from './web-vitals';
import { isClientSentryEnabled } from './sentry.client';

/**
 * SaaS-only 모드(자체 observability endpoint 미설정)에서 예산 초과 Web Vitals를 Sentry에 보고한다.
 */
export function reportExceededWebVitalToSentry(
  payload: WebVitalsReportPayload,
): void {
  if (!isClientSentryEnabled() || !payload.exceededBudget) return;

  Sentry.withScope((scope) => {
    scope.setTag('service', 'client');
    scope.setTag('webVital', payload.name);
    scope.setLevel('warning');
    scope.setContext('web_vitals', {
      name: payload.name,
      value: payload.value,
      rating: payload.rating,
      path: payload.path,
      navigationType: payload.navigationType,
    });
    Sentry.captureMessage(
      `[web-vitals] ${payload.name as WebVitalName} budget exceeded (${payload.value})`,
      'warning',
    );
  });
}
