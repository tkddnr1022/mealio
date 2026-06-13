const SESSION_DEDUPE_SENT_VALUE = '1' as const;

/**
 * 세션당 한 번만 `action`을 실행한다.
 * sessionStorage 접근이 불가하면 서버 dedupe 정책에 위임하기 위해 항상 `action`을 호출한다.
 */
export function runOncePerSession(
  sessionKey: string,
  action: () => void,
): void {
  if (typeof window === 'undefined') return;

  try {
    if (sessionStorage.getItem(sessionKey) === SESSION_DEDUPE_SENT_VALUE) {
      return;
    }
    sessionStorage.setItem(sessionKey, SESSION_DEDUPE_SENT_VALUE);
  } catch {
    // sessionStorage 접근 불가 환경에서는 서버 dedupe 정책에 위임한다.
  }

  action();
}
