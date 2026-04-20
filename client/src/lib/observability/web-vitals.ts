import type { Metric, MetricType } from 'web-vitals';

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

import { env } from '@/lib/config/env';
import { logger } from '@/lib/utils/logger';

/**
 * Web Vitals(LCP/INP/CLS 등) 수집·리포팅 모듈.
 *
 * - 성능 목표·페이지별 예산은 `agent/frontend/spec/frontend_architecture_spec.md` §4에 정의되어 있다.
 * - 수집은 Google의 `web-vitals` 라이브러리를 사용하며, Next.js App Router에서는
 *   `next/web-vitals`의 `useReportWebVitals(reportWebVital)` 훅과도 호환된다.
 * - 전송은 `navigator.sendBeacon`을 우선 사용해 언로드 시점에도 유실을 줄이고,
 *   미지원 환경에서는 `fetch(..., { keepalive: true })`로 폴백한다.
 *
 * 참고: Web Vitals v4+에서 FID는 INP로 대체되었다(Google, 2024-03). 본 모듈은 스펙상
 * "FID"가 가리키는 "입력 응답성 예산(100ms)"을 유지하되, 실제 수집·판정은 INP(≤200ms)로 한다.
 *
 * 환경 변수:
 * - `NEXT_PUBLIC_OBSERVABILITY_ENDPOINT` (`env.observabilityEndpoint`): 리포팅 수신 URL.
 *   analytics 이벤트와 공용으로 사용한다.
 *   - 미설정 시: 전송을 생략하고 개발 환경에서 `console`로만 출력한다.
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
 * 또는 프레임워크 없이 직접 구독:
 * ```ts
 * registerWebVitals(); // _app 진입 시 1회 호출
 * ```
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

export interface ReportWebVitalOptions {
  /** 리포팅 수신 URL. 미지정 시 `env.observabilityEndpoint`를 사용 */
  endpoint?: string;
  /** 추가 메타데이터(유저 ID, AB 테스트 변형 등). 서버가 집계에 활용 */
  context?: Record<string, unknown>;
  /** dev 환경 외에도 console 로그를 강제로 남길지 여부 */
  debug?: boolean;
}

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

const DEFAULT_ENDPOINT = env.observabilityEndpoint;

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
 * Web Vitals 메트릭을 리포팅 엔드포인트로 전송한다.
 *
 * - 전송 우선순위: `navigator.sendBeacon` → `fetch({ keepalive: true })`.
 * - 엔드포인트가 비어 있으면 전송을 생략한다(dev에서는 콘솔로만 출력).
 * - 리포팅 실패는 앱 동작을 방해하지 않도록 조용히 무시한다.
 */
export function reportWebVital(
  metric: WebVitalMetric,
  options: ReportWebVitalOptions = {},
): void {
  const payload = buildPayload(metric, options.context);
  const endpoint = options.endpoint ?? DEFAULT_ENDPOINT;

  if (!env.isProduction || options.debug) {
    const level = payload.exceededBudget ? 'warn' : 'info';
    logger[level](
      `[web-vitals] ${payload.name}=${payload.value}${
        payload.exceededBudget ? ' (budget exceeded)' : ''
      }`,
      payload as unknown as Record<string, unknown>,
    );
  }

  if (!endpoint) return;
  if (typeof window === 'undefined') return;

  sendPayload(endpoint, payload);
}

/**
 * 고정된 옵션으로 동작하는 리포터 함수를 생성한다.
 * 테스트·여러 엔드포인트 동시 리포팅이 필요할 때 사용한다.
 */
export function createWebVitalsReporter(
  options: ReportWebVitalOptions,
): (metric: WebVitalMetric) => void {
  return (metric) => reportWebVital(metric, options);
}

export interface RegisterWebVitalsOptions extends ReportWebVitalOptions {
  /** 메트릭 변화마다 리포트 (기본: false — 최종 확정값만 전송) */
  reportAllChanges?: boolean;
  /** 모듈 구독에 대한 커스텀 리포터. 미지정 시 reportWebVital 사용 */
  reporter?: (metric: WebVitalMetric) => void;
}

/**
 * 브라우저 환경에서 Web Vitals 구독을 등록한다.
 *
 * - SSR/빌드 단계에서는 no-op이 되어 안전하다.
 * - Next.js App Router 환경이라면 일반적으로 `useReportWebVitals(reportWebVital)`를
 *   사용하는 편이 중복 구독을 피하기 쉽다. 이 함수는 Next 외 환경·직접 제어가
 *   필요한 경우의 대안이다.
 */
export function registerWebVitals(
  options: RegisterWebVitalsOptions = {},
): void {
  if (typeof window === 'undefined') return;

  const reporter =
    options.reporter ??
    ((metric: WebVitalMetric) => reportWebVital(metric, options));

  const reportOpts = { reportAllChanges: options.reportAllChanges ?? false };

  onLCP(reporter, reportOpts);
  onINP(reporter, reportOpts);
  onCLS(reporter, reportOpts);
  onFCP(reporter, reportOpts);
  onTTFB(reporter, reportOpts);
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

function sendPayload(endpoint: string, payload: WebVitalsReportPayload): void {
  const body = JSON.stringify(payload);

  try {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.sendBeacon === 'function'
    ) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }
  } catch {
    // sendBeacon 호출 자체가 실패하는 경우(예: CSP 위반)엔 fetch로 폴백
  }

  try {
    void fetch(endpoint, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      credentials: 'include',
    }).catch(() => {
      // 리포팅 실패는 사용자 흐름을 막지 않는다
    });
  } catch {
    // fetch 동기 throw (env 폴리필 부재 등)도 무시
  }
}
