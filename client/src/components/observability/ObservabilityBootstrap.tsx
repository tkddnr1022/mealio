'use client';

import { Analytics } from '@vercel/analytics/next';
import { useReportWebVitals } from 'next/web-vitals';
import { useEffect, useRef } from 'react';

import { registerAnalyticsDispatcher } from '@/lib/observability/analytics';
import { createGa4Dispatcher } from '@/lib/observability/ga-dispatcher';
import { reportWebVital } from '@/lib/observability/web-vitals';
import { createSentryLogSink } from '@/lib/observability/sentry.client';
import { env } from '@/lib/config/env';
import { setLogSink } from '@/lib/utils/logger';

/** 모듈 스코프 1회 초기화 — HMR에서도 sink·Sentry 중복 등록 방지 */
let observabilityBootstrapped = false;
let unregisterGaDispatcher: (() => void) | null = null;

/**
 * GA4 dispatcher·log sink를 1회만 등록한다.
 * Sentry SDK 초기화는 `instrumentation-client.ts`에서 자동 수행된다.
 * @returns analytics dispatcher 해제 함수 (useEffect cleanup용)
 */
function bootstrapObservability(): () => void {
  if (observabilityBootstrapped || typeof window === 'undefined') {
    return () => {};
  }
  observabilityBootstrapped = true;

  setLogSink(createSentryLogSink());

  if (env.gaMeasurementId) {
    unregisterGaDispatcher = registerAnalyticsDispatcher(createGa4Dispatcher());
  }

  return () => {
    unregisterGaDispatcher?.();
    unregisterGaDispatcher = null;
  };
}

/** Vitest/HMR에서 모듈 상태 초기화 */
export function resetObservabilityBootstrapForTests(): void {
  observabilityBootstrapped = false;
  unregisterGaDispatcher?.();
  unregisterGaDispatcher = null;
}

/**
 * 루트 레이아웃에서 1회 마운트 — GA4, Vercel Analytics, Web Vitals.
 *
 * - `useReportWebVitals`는 Next가 제공하는 메트릭만 수집한다.
 *
 * **page_view 정책**: `GoogleAnalytics` 컴포넌트(@next/third-parties)가
 * 초기 로드 시 `gtag('config', gaId)`를 통해 자동 pageview를 전송하고,
 * SPA 라우트 전환은 GA Enhanced Measurement("Page changes based on browser history events")가 처리한다.
 * 수동 `trackPageView` 호출은 사용하지 않는다.
 */
export function ObservabilityBootstrap() {
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    return bootstrapObservability();
  }, []);

  useReportWebVitals(reportWebVital);

  return <>{env.isProduction ? <Analytics /> : null}</>;
}
