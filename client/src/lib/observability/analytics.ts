/**
 * 페이지 이동·사용자 이벤트 트래킹 래퍼.
 *
 * - 앱 코드는 본 모듈의 {@link trackPageView} / {@link trackEvent}만 호출하도록 유지하고,
 *   실제 전송 로직(PostHog·Vercel Analytics·자체 수집 백엔드 등)은
 *   {@link registerAnalyticsDispatcher}로 주입한다.
 * - 디스패처가 등록되지 않은 경우, dev 환경에서는 콘솔에 출력하고 production에서는 조용히 무시한다.
 * - 이벤트 이름은 스네이크 케이스(`recipe_viewed`, `chatbot_message_sent`)를 권장한다.
 *
 * 사용 예 (App Router):
 * ```tsx
 * 'use client';
 * import { usePathname, useSearchParams } from 'next/navigation';
 * import { useEffect } from 'react';
 * import { trackPageView } from '@/lib/observability/analytics';
 *
 * export function RouteAnalytics() {
 *   const pathname = usePathname();
 *   const search = useSearchParams();
 *   useEffect(() => {
 *     trackPageView(pathname, Object.fromEntries(search.entries()));
 *   }, [pathname, search]);
 *   return null;
 * }
 * ```
 */

import { logger } from '@/lib/utils/logger';

export interface AnalyticsContext {
  /** 로그인 유저 식별자(익명이면 undefined) */
  userId?: string;
  /** 세션 식별자(익명 추적에 사용) */
  sessionId?: string;
  /** AB 테스트 변형 등 임의 메타데이터 */
  properties?: Record<string, unknown>;
}

export interface AnalyticsEvent {
  type: 'event';
  /** 이벤트 이름 (스네이크 케이스 권장) */
  name: string;
  props?: Record<string, unknown>;
  path?: string;
  timestamp: number;
  context?: AnalyticsContext;
}

export interface AnalyticsPageView {
  type: 'page_view';
  path: string;
  params?: Record<string, unknown>;
  timestamp: number;
  context?: AnalyticsContext;
}

export type AnalyticsPayload = AnalyticsEvent | AnalyticsPageView;

export type AnalyticsDispatcher = (payload: AnalyticsPayload) => void;

const dispatchers = new Set<AnalyticsDispatcher>();
let globalContext: AnalyticsContext = {};

/**
 * 디스패처를 등록한다. 반환된 함수를 호출하면 등록이 해제된다.
 * StrictMode/HMR 환경의 중복 등록을 피하려면 useEffect cleanup에 연결하라.
 */
export function registerAnalyticsDispatcher(
  dispatcher: AnalyticsDispatcher,
): () => void {
  dispatchers.add(dispatcher);
  return () => {
    dispatchers.delete(dispatcher);
  };
}

/** 테스트·teardown용 전체 해제 */
export function clearAnalyticsDispatchers(): void {
  dispatchers.clear();
}

/**
 * 모든 이벤트에 자동 병합되는 전역 컨텍스트를 설정한다.
 * 로그인/로그아웃 시 userId·sessionId 주입 등에 사용한다.
 * 기존 값과 병합되며(`{ ...prev, ...next }`), `null`을 넘기면 해당 키는 유지된다.
 */
export function setAnalyticsContext(
  context: Partial<AnalyticsContext> | null,
): void {
  if (context === null) {
    globalContext = {};
    return;
  }
  globalContext = { ...globalContext, ...context };
}

export function getAnalyticsContext(): AnalyticsContext {
  return globalContext;
}

/**
 * 페이지 이동을 트래킹한다.
 * Next.js App Router에서는 `usePathname()`/`useSearchParams()` 조합으로 호출한다.
 */
export function trackPageView(
  path: string,
  params?: Record<string, unknown>,
): void {
  const payload: AnalyticsPageView = {
    type: 'page_view',
    path,
    params,
    timestamp: Date.now(),
    context: Object.keys(globalContext).length > 0 ? globalContext : undefined,
  };
  dispatch(payload);
}

/**
 * 사용자 이벤트를 트래킹한다(버튼 클릭, 레시피 저장, 챗봇 메시지 전송 등).
 *
 * @param name 이벤트 이름 (예: `recipe_saved`, `chatbot_message_sent`)
 * @param props 이벤트 속성 (가능하면 직렬화 가능한 primitive로 유지)
 */
export function trackEvent(
  name: string,
  props?: Record<string, unknown>,
): void {
  const payload: AnalyticsEvent = {
    type: 'event',
    name,
    props,
    path:
      typeof window !== 'undefined' && window.location
        ? window.location.pathname
        : undefined,
    timestamp: Date.now(),
    context: Object.keys(globalContext).length > 0 ? globalContext : undefined,
  };
  dispatch(payload);
}

function dispatch(payload: AnalyticsPayload): void {
  if (dispatchers.size === 0) {
    // dispatcher 미등록 상태는 "의도적 no-op"과 "미초기화" 둘 다 가능하므로 debug 레벨로만 남긴다.
    logger.debug('[analytics] no dispatcher registered', { payload });
    return;
  }

  for (const dispatcher of dispatchers) {
    try {
      dispatcher(payload);
    } catch (error) {
      logger.error('[analytics] dispatcher threw', { error, payload });
    }
  }
}
