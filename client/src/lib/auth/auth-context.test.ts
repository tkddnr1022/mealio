// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, createElement, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AuthProvider,
  AuthStatus,
  useAuth,
  type AuthContextValue,
} from './auth-context';
import {
  clearPersistedAuthStatus,
  writePersistedAuthStatus,
} from './auth-status.storage';

const mockUser = {
  id: 1,
  email: 'user@example.com',
  nickname: 'mealio',
  createdAt: '2026-01-01T00:00:00.000Z',
  creditBalance: 10,
  creditMonthlyLimit: 100,
};

const fetchCurrentUserMock = vi.fn();

vi.mock('./session.client', () => ({
  fetchCurrentUser: (...args: unknown[]) => fetchCurrentUserMock(...args),
}));

let authSnapshot: AuthContextValue | null = null;

function AuthProbe(): null {
  const auth = useAuth();

  useEffect(() => {
    authSnapshot = auth;
  }, [auth]);

  return null;
}

function renderAuthProvider(): { root: Root; queryClient: QueryClient } {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(AuthProvider, null, createElement(AuthProbe)),
      ),
    );
  });

  return { root, queryClient };
}

async function waitFor(
  predicate: () => boolean,
  timeoutMs = 3_000,
): Promise<void> {
  const startedAt = Date.now();
  while (!predicate()) {
    if (Date.now() - startedAt > timeoutMs) {
      throw new Error('Timed out waiting for auth state');
    }
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }
}

describe('AuthProvider lazy-fetch', () => {
  let root: Root | null = null;

  beforeEach(() => {
    authSnapshot = null;
    fetchCurrentUserMock.mockReset();
    clearPersistedAuthStatus();
  });

  afterEach(() => {
    act(() => {
      root?.unmount();
    });
    root = null;
    document.body.innerHTML = '';
    vi.clearAllMocks();
    clearPersistedAuthStatus();
  });

  it('resolves to Unauthenticated without fetching /me when localStorage is empty', async () => {
    ({ root } = renderAuthProvider());

    await waitFor(() => authSnapshot?.status === AuthStatus.Unauthenticated);

    expect(fetchCurrentUserMock).not.toHaveBeenCalled();
    expect(authSnapshot?.user).toBeNull();
  });

  it('does not fetch /me when localStorage is Unauthenticated', async () => {
    writePersistedAuthStatus(AuthStatus.Unauthenticated);
    ({ root } = renderAuthProvider());

    await waitFor(() => authSnapshot?.status === AuthStatus.Unauthenticated);

    expect(fetchCurrentUserMock).not.toHaveBeenCalled();
    expect(authSnapshot?.user).toBeNull();
  });

  it('fetches /me once when localStorage is Authenticated', async () => {
    writePersistedAuthStatus(AuthStatus.Authenticated);
    fetchCurrentUserMock.mockResolvedValue(mockUser);

    ({ root } = renderAuthProvider());

    await waitFor(() => authSnapshot?.status === AuthStatus.Authenticated);

    expect(fetchCurrentUserMock).toHaveBeenCalledTimes(1);
    expect(authSnapshot?.user).toEqual(mockUser);
  });

  it('demotes to Unauthenticated when /me returns null', async () => {
    writePersistedAuthStatus(AuthStatus.Authenticated);
    fetchCurrentUserMock.mockResolvedValue(null);

    ({ root } = renderAuthProvider());

    await waitFor(() => authSnapshot?.status === AuthStatus.Unauthenticated);

    expect(fetchCurrentUserMock).toHaveBeenCalledTimes(1);
    expect(authSnapshot?.user).toBeNull();
  });

  it('keeps Authenticated when /me fetch fails', async () => {
    writePersistedAuthStatus(AuthStatus.Authenticated);
    fetchCurrentUserMock.mockRejectedValue(new Error('network error'));

    ({ root } = renderAuthProvider());

    await waitFor(() => authSnapshot?.status === AuthStatus.Authenticated);

    expect(fetchCurrentUserMock).toHaveBeenCalledTimes(1);
    expect(authSnapshot?.user).toBeNull();
  });

  it('refresh() fetches /me and exposes the user (OAuth flow)', async () => {
    fetchCurrentUserMock.mockResolvedValue(mockUser);

    ({ root } = renderAuthProvider());
    await waitFor(
      () => authSnapshot?.status === AuthStatus.Unauthenticated,
    );
    expect(fetchCurrentUserMock).not.toHaveBeenCalled();

    await act(async () => {
      await authSnapshot!.refresh();
    });

    await waitFor(() => authSnapshot?.status === AuthStatus.Authenticated);

    expect(fetchCurrentUserMock).toHaveBeenCalledTimes(1);
    expect(authSnapshot?.user).toEqual(mockUser);
  });
});
