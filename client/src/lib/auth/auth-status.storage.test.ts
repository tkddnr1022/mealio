// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AuthStatus } from './auth-status';
import {
  AUTH_STATUS_STORAGE_KEY,
  clearPersistedAuthStatus,
  readPersistedAuthStatus,
  writePersistedAuthStatus,
} from './auth-status.storage';

describe('auth-status.storage', () => {
  afterEach(() => {
    clearPersistedAuthStatus();
  });

  it('persists Authenticated and Unauthenticated only', () => {
    writePersistedAuthStatus(AuthStatus.Authenticated);
    expect(localStorage.getItem(AUTH_STATUS_STORAGE_KEY)).toBe(
      String(AuthStatus.Authenticated),
    );
    expect(readPersistedAuthStatus()).toBe(AuthStatus.Authenticated);

    writePersistedAuthStatus(AuthStatus.Unauthenticated);
    expect(readPersistedAuthStatus()).toBe(AuthStatus.Unauthenticated);

    writePersistedAuthStatus(AuthStatus.Loading);
    expect(readPersistedAuthStatus()).toBe(AuthStatus.Unauthenticated);
  });

  it('returns null for missing or invalid values', () => {
    expect(readPersistedAuthStatus()).toBeNull();
    localStorage.setItem(AUTH_STATUS_STORAGE_KEY, 'invalid');
    expect(readPersistedAuthStatus()).toBeNull();
  });

  it('clearPersistedAuthStatus removes the key', () => {
    writePersistedAuthStatus(AuthStatus.Authenticated);
    clearPersistedAuthStatus();
    expect(localStorage.getItem(AUTH_STATUS_STORAGE_KEY)).toBeNull();
  });
});

describe('auth-session bridge', () => {
  afterEach(() => {
    clearPersistedAuthStatus();
    vi.restoreAllMocks();
  });

  it('notifyAuthSessionCleared writes Unauthenticated and dispatches event', async () => {
    const { notifyAuthSessionCleared, subscribeAuthSessionCleared } =
      await import('./auth-session');

    writePersistedAuthStatus(AuthStatus.Authenticated);
    const listener = vi.fn();
    subscribeAuthSessionCleared(listener);

    notifyAuthSessionCleared();

    expect(readPersistedAuthStatus()).toBe(AuthStatus.Unauthenticated);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
