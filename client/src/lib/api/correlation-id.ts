/**
 * 분산 추적용 Correlation-Id.
 *
 * 서버·클라이언트가 공유하는 HTTP 헤더 이름과 기본 생성기를 한곳에 둔다.
 * `HttpClient`는 매 요청 헤더에 id를 주입하고, 서버는 동일 id를 응답·로그에 전파한다.
 */

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
