/**
 * CSR 인증 세션 정리·구독 브리지.
 *
 * `http-client` refresh 실패, 로그아웃, SSR refresh 실패(`sessionExpired=1`) 등
 * AuthContext 밖에서 발생하는 세션 무효화를 한 경로로 수렴한다.
 */

import { AuthStatus } from './auth-status';
import { writePersistedAuthStatus } from './auth-status.storage';

export const AUTH_SESSION_CLEARED_EVENT = 'mealio:auth-session-cleared';

/** localStorage·AuthContext를 Unauthenticated로 수렴시키는 신호를 발행한다. */
export function notifyAuthSessionCleared(): void {
  if (typeof window === 'undefined') return;
  writePersistedAuthStatus(AuthStatus.Unauthenticated);
  window.dispatchEvent(new CustomEvent(AUTH_SESSION_CLEARED_EVENT));
}

/** 세션 정리 신호를 구독한다. 반환값은 구독 해제 함수. */
export function subscribeAuthSessionCleared(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  window.addEventListener(AUTH_SESSION_CLEARED_EVENT, listener);
  return () => window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, listener);
}
