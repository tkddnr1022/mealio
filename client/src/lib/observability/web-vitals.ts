import type { Metric, MetricType } from 'web-vitals';

import { logger } from '@/lib/utils/logger';

/**
 * Web Vitals(LCP/INP/CLS 등) 수집·리포팅 모듈
 *
 * - 성능 목표·페이지별 예산은 `agent/frontend/spec/frontend_architecture_spec.md` §4에 정의되어 있다.
 * - 수집은 Google의 `web-vitals` 라이브러리를 사용하며, Next.js App Router에서는
 *   `next/web-vitals`의 `useReportWebVitals(reportWebVital)` 훅과도 호환된다.
 * - production 예산 초과는 `logger.warn` → Sentry log sink로 보고하고, 실시간 수집은 Vercel Analytics를 사용한다.
 *
 * 참고: Web Vitals v4+에서 FID는 INP로 대체되었다(Google, 2024-03). 본 모듈은 스펙상
 * "FID"가 가리키는 "입력 응답성 예산(100ms)"을 유지하되, 실제 수집·판정은 INP(≤200ms)로 한다.
 *
 * 사용 예 (Next.js App Router):
 * ```tsx
 * 'use client';
 * import { useReportWebVitals } from 'next/web-vitals';
 * import { reportWebVital } from '@/lib/observability/web-vitals';
 *
 * export function WebVitalsReporter() {
 *   useReportWebVitals(reportWebVital);
 *   return null;
 * }
 * ```
 *
 */

export type WebVitalName = MetricType['name'];

/**
 * §4.1 Web Vitals 목표값.
 * - LCP: ≤ 2.5s (2500ms)
 * - FID→INP: ≤ 200ms (FID 100ms 목표를 INP 200ms로 상향해 최신 Core Web Vitals 기준과 정합)
 * - CLS: ≤ 0.1 (unitless)
 *
 * FCP/TTFB은 참고용 지표로 별도 예산을 두지 않는다(undefined).
 */
export const WEB_VITAL_BUDGET: Partial<Record<WebVitalName, number>> = {
  LCP: 2500,
  INP: 200,
  CLS: 0.1,
};

export type WebVitalMetric = Metric | MetricType;

export interface WebVitalsReportPayload {
  id: string;
  name: WebVitalName;
  value: number;
  delta: number;
  rating: Metric['rating'];
  navigationType: Metric['navigationType'];
  path: string | null;
  timestamp: number;
  exceededBudget: boolean;
  userAgent?: string;
  [key: string]: unknown;
}

/**
 * 단일 Web Vitals 메트릭이 §4.1 예산을 초과했는지 판단한다.
 * 예산이 정의되지 않은 메트릭(FCP, TTFB 등)은 항상 false를 반환한다.
 */
export function isBudgetExceeded(
  metric: Pick<WebVitalMetric, 'name' | 'value'>,
): boolean {
  const budget = WEB_VITAL_BUDGET[metric.name];
  if (budget === undefined) return false;
  return metric.value > budget;
}

/**
 * Web Vitals 메트릭을 수집·보고한다
 */
export function reportWebVital(
  metric: WebVitalMetric,
  /** 추가 메타데이터(유저 ID, AB 테스트 변형 등) */
  optionalContext?: Record<string, unknown>,
): void {
  const payload = buildPayload(metric, optionalContext);
  const message = `[web-vitals] ${payload.name}=${payload.value}${
    payload.exceededBudget ? ' (budget exceeded)' : ''
  }`;
  const context = payload as unknown as Record<string, unknown>;
  const level = payload.exceededBudget ? 'warn' : 'info';
  logger[level](message, context);
}

/**
 * 고정된 옵션으로 동작하는 리포터 함수를 생성한다.
 * 테스트·여러 엔드포인트 동시 리포팅이 필요할 때 사용한다.
 */
export function createWebVitalsReporter(
  optionalContext: Record<string, unknown>,
): (metric: WebVitalMetric) => void {
  return (metric) => reportWebVital(metric, optionalContext);
}

function buildPayload(
  metric: WebVitalMetric,
  context?: Record<string, unknown>,
): WebVitalsReportPayload {
  const path =
    typeof window !== 'undefined' && window.location
      ? window.location.pathname
      : null;

  return {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: metric.rating,
    navigationType: metric.navigationType,
    path,
    timestamp: Date.now(),
    exceededBudget: isBudgetExceeded(metric),
    userAgent:
      typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    ...context,
  };
}
