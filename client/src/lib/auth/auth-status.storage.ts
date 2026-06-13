import { AuthStatus } from './auth-status';

/** localStorage 키 — `localStorage.status` */
export const AUTH_STATUS_STORAGE_KEY = 'status';

/**
 * 영속화 가능한 AuthStatus만 localStorage에 기록한다.
 * `Loading`은 비영속 상태이므로 저장하지 않는다.
 */
export function writePersistedAuthStatus(status: AuthStatus): void {
  if (typeof window === 'undefined') return;
  if (
    status !== AuthStatus.Authenticated &&
    status !== AuthStatus.Unauthenticated
  )
    return;
  try {
    window.localStorage.setItem(AUTH_STATUS_STORAGE_KEY, String(status));
  } catch {
    // quota/private mode 등 — 무시
  }
}

/** localStorage에 저장된 AuthStatus를 읽는다. 없거나 잘못된 값이면 `null`. */
export function readPersistedAuthStatus(): AuthStatus | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STATUS_STORAGE_KEY);
    if (raw === null) return null;
    const parsed = Number(raw);
    if (
      parsed === AuthStatus.Authenticated ||
      parsed === AuthStatus.Unauthenticated
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearPersistedAuthStatus(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AUTH_STATUS_STORAGE_KEY);
  } catch {
    // ignore
  }
}
