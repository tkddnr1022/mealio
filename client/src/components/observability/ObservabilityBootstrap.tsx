'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { useEffect, useRef } from 'react';

import { registerAnalyticsDispatcher, trackPageView } from '@/lib/observability/analytics';
import { createGa4Dispatcher } from '@/lib/observability/ga-dispatcher';
import { reportWebVital } from '@/lib/observability/web-vitals';
import {
  createSentryLogSink,
  initClientSentry,
} from '@/lib/observability/sentry.client';
import { env } from '@/lib/config/env';
import { setLogSink } from '@/lib/utils/logger';

let observabilityBootstrapped = false;

function bootstrapObservability(): void {
  if (observabilityBootstrapped || typeof window === 'undefined') return;
  observabilityBootstrapped = true;

  initClientSentry();
  setLogSink(createSentryLogSink());

  if (env.gaMeasurementId) {
    registerAnalyticsDispatcher(createGa4Dispatcher(env.gaMeasurementId));
  }
}

/**
 * 루트 레이아웃에서 1회 마운트 — Sentry log sink, GA4 dispatcher, Web Vitals, 라우트 page_view.
 */
export function ObservabilityBootstrap() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    bootstrapObservability();
  }, []);

  useReportWebVitals(reportWebVital);

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    trackPageView(pathname, params);
  }, [pathname, searchParams]);

  return null;
}
