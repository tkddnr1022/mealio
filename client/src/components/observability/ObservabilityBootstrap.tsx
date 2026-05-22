'use client';

import { Analytics } from '@vercel/analytics/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';
import { useEffect, useRef } from 'react';

import {
  registerAnalyticsDispatcher,
  trackPageView,
} from '@/lib/observability/analytics';
import { createGa4Dispatcher } from '@/lib/observability/ga-dispatcher';
import { reportWebVital } from '@/lib/observability/web-vitals';
import {
  createSentryLogSink,
  initClientSentry,
} from '@/lib/observability/sentry.client';
import { env } from '@/lib/config/env';
import { setLogSink } from '@/lib/utils/logger';

/** 모듈 스코프 1회 초기화 — HMR에서도 sink·Sentry 중복 등록 방지 */
let observabilityBootstrapped = false;
let unregisterGaDispatcher: (() => void) | null = null;

/**
 * Sentry·GA4 dispatcher·log sink를 1회만 등록한다.
 * @returns analytics dispatcher 해제 함수 (useEffect cleanup용)
 */
function bootstrapObservability(): () => void {
  if (observabilityBootstrapped || typeof window === 'undefined') {
    return () => {};
  }
  observabilityBootstrapped = true;

  initClientSentry();
  setLogSink(createSentryLogSink());

  if (env.gaMeasurementId) {
    unregisterGaDispatcher = registerAnalyticsDispatcher(
      createGa4Dispatcher(env.gaMeasurementId),
    );
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
 * 루트 레이아웃에서 1회 마운트 — Sentry, GA4, Vercel Analytics, Web Vitals, 라우트 page_view.
 *
 * - `useReportWebVitals`는 Next가 제공하는 메트릭만 수집한다(중복 `registerWebVitals` 호출 없음).
 * - `trackPageView`는 pathname·searchParams 변경마다 실행된다(쿼리 변경 포함).
 */
export function ObservabilityBootstrap() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    return bootstrapObservability();
  }, []);

  useReportWebVitals(reportWebVital);

  useEffect(() => {
    const params =
      searchKey.length > 0
        ? Object.fromEntries(new URLSearchParams(searchKey).entries())
        : undefined;
    trackPageView(pathname, params);
  }, [pathname, searchKey]);

  return (
    <>
      {env.isProduction ? <Analytics /> : null}
    </>
  );
}
