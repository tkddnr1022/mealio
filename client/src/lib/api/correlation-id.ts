/**
 * 분산 추적용 Correlation-Id.
 *
 * 서버·클라이언트가 공유하는 HTTP 헤더 이름과 기본 생성기를 한곳에 둔다.
 * `HttpClient`는 SSR에서 요청당 동일 id를, CSR에서는 호출마다 새 id를 헤더에 주입한다.
 */

import { cache } from 'react';

export const CORRELATION_ID_HEADER = 'X-Correlation-Id';

/**
 * 기본 Correlation-Id 생성기.
 * - 브라우저·최신 Node: `crypto.randomUUID()` 사용 (RFC 4122 v4, 충돌 가능성 ~0).
 * - 폴백: `Date.now()` + `Math.random()` 조합.
 */
export function defaultCorrelationIdGenerator(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `cid-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/**
 * SSR·RSC 요청 스코프에서 Correlation-Id를 1회만 생성한다.
 * `defaultCorrelationIdGenerator`를 `React.cache`로 감싸 동일 요청의
 * 여러 `HttpClient` 호출이 같은 id를 쓰게 한다(Next Data Cache 키 안정성).
 */
export const getRequestCorrelationId = cache(defaultCorrelationIdGenerator);

/**
 * HttpClient 기본 생성기.
 * - 서버: {@link getRequestCorrelationId} (요청당 동일)
 * - 브라우저: {@link defaultCorrelationIdGenerator} (호출마다 신규)
 */
export function resolveCorrelationId(): string {
  if (typeof window === 'undefined') {
    return getRequestCorrelationId();
  }
  return defaultCorrelationIdGenerator();
}
