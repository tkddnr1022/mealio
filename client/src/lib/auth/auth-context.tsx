'use client';

/**
 * 클라이언트 전역 인증 상태 Provider.
 *
 * - `AuthStatus`는 localStorage(`status` 키)에 영속화되며, `Loading`은 비영속 상태다.
 * - SSR·hydration 첫 렌더는 `Loading`으로 맞춘다. mount 후 localStorage·`/me` 결과로 확정한다.
 * - `Unauthenticated`·localStorage 미설정(`null`)일 때는 `/me`를 호출하지 않는다.
 * - `Authenticated`(로그인 직후·localStorage 복원)에서만 `/me`를 fetch한다.
 * - 노출 `status`의 `Loading`은 (1) hydration bootstrap 중, (2) `Authenticated` + 프로필 bootstrap 중(`query.isPending`)일 때다.
 * - 유저 데이터 SSOT는 React Query 캐시(`userQueries.me`)이며, 본 Provider는 status·캐시를 동기화한다.
 * - OAuth 성공 후 `/oauth/callback`에서 `refresh()`로 Authenticated 마킹·`/me` 재조회 후 `next`로 이동한다.
 * - `/me`가 null(비로그인)이면 Unauthenticated로 강등한다. 네트워크·서버 오류 시에는 Authenticated를 유지한다.
 * - 로그아웃·SSR refresh 실패(`sessionExpired=1`) 등은 `auth-session` 브리지로 수렴한다.
 */

import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import { QUERY_CACHE } from '@/lib/policy/cache.policy';
import { useCurrentUser, userQueries } from '@/lib/queries/user.queries';
import type { UserProfile } from '@/lib/types/user';
import { logger } from '@/lib/utils/logger';

import { subscribeAuthSessionCleared } from './auth-session';
import { AuthStatus } from './auth-status';
import {
  AUTH_STATUS_STORAGE_KEY,
  readPersistedAuthStatus,
  writePersistedAuthStatus,
} from './auth-status.storage';
import { fetchCurrentUser } from './session.client';
import type { SessionUser } from './session';

export { AuthStatus } from './auth-status';

export interface AuthContextValue {
  user: SessionUser | null;
  status: AuthStatus;
  /** 서버에서 최신 세션을 다시 조회한다. (예: OAuth 콜백, 닉네임 변경 후) */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function subscribePersistedAuthStatus(onStoreChange: () => void): () => void {
  const handler = (event: StorageEvent) => {
    if (event.key === AUTH_STATUS_STORAGE_KEY || event.key === null) {
      onStoreChange();
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

export interface AuthProviderProps {
  children: ReactNode;
}

function useIsHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function resolveBaseSessionStatus(
  isHydrated: boolean,
  manualSessionStatus: AuthStatus | null,
  persistedStatus: AuthStatus | null,
): AuthStatus {
  if (!isHydrated) return AuthStatus.Loading;

  if (manualSessionStatus !== null) {
    if (
      manualSessionStatus === AuthStatus.Unauthenticated &&
      persistedStatus === AuthStatus.Authenticated
    ) {
      return AuthStatus.Authenticated;
    }
    return manualSessionStatus;
  }

  return persistedStatus === AuthStatus.Authenticated
    ? AuthStatus.Authenticated
    : AuthStatus.Unauthenticated;
}

export function AuthProvider({
  children,
}: AuthProviderProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const isHydrated = useIsHydrated();
  const [manualSessionStatus, setManualSessionStatus] =
    useState<AuthStatus | null>(null);

  const persistedStatus = useSyncExternalStore(
    subscribePersistedAuthStatus,
    readPersistedAuthStatus,
    () => null,
  );

  const setStatus = useCallback(
    (next: AuthStatus) => {
      setManualSessionStatus(next);
      if (
        next === AuthStatus.Authenticated ||
        next === AuthStatus.Unauthenticated
      ) {
        writePersistedAuthStatus(next);
      }
      if (
        next === AuthStatus.Authenticated &&
        queryClient.getQueryData(userQueries.me()) === null
      ) {
        queryClient.removeQueries({ queryKey: userQueries.me() });
      }
    },
    [queryClient],
  );

  const baseSessionStatus = useMemo(
    () =>
      resolveBaseSessionStatus(
        isHydrated,
        manualSessionStatus,
        persistedStatus,
      ),
    [isHydrated, manualSessionStatus, persistedStatus],
  );

  const cachedMe = queryClient.getQueryData<UserProfile | null>(userQueries.me());
  const hasInvalidSessionCache = cachedMe === null;

  const shouldFetchUser =
    isHydrated &&
    baseSessionStatus === AuthStatus.Authenticated &&
    !hasInvalidSessionCache;

  const query = useCurrentUser({
    enabled: shouldFetchUser,
  });

  const isSessionDemotedByQuery =
    isHydrated &&
    baseSessionStatus === AuthStatus.Authenticated &&
    hasInvalidSessionCache &&
    manualSessionStatus !== AuthStatus.Authenticated;

  const sessionStatus = isSessionDemotedByQuery
    ? AuthStatus.Unauthenticated
    : baseSessionStatus;

  const status =
    !isHydrated || sessionStatus === AuthStatus.Loading
      ? AuthStatus.Loading
      : sessionStatus === AuthStatus.Authenticated &&
          shouldFetchUser &&
          query.isPending &&
          query.data === undefined
        ? AuthStatus.Loading
        : sessionStatus;

  useEffect(() => {
    if (!isSessionDemotedByQuery) return;

    writePersistedAuthStatus(AuthStatus.Unauthenticated);
  }, [isSessionDemotedByQuery]);

  useEffect(() => {
    if (persistedStatus !== AuthStatus.Authenticated) return;

    if (queryClient.getQueryData(userQueries.me()) === null) {
      queryClient.removeQueries({ queryKey: userQueries.me() });
    }
  }, [persistedStatus, queryClient]);

  useEffect(() => {
    if (!shouldFetchUser || !query.isError) return;

    logger.error('[AuthProvider] session query failed', {
      error: query.error,
    });
  }, [shouldFetchUser, query.isError, query.error]);

  useEffect(() => {
    return subscribeAuthSessionCleared(() => {
      setStatus(AuthStatus.Unauthenticated);
      queryClient.setQueryData(userQueries.me(), null);
    });
  }, [queryClient, setStatus]);

  const refresh = useCallback(async () => {
    setStatus(AuthStatus.Authenticated);
    await queryClient.fetchQuery({
      queryKey: userQueries.me(),
      queryFn: ({ signal }) => fetchCurrentUser({ signal }),
      staleTime: QUERY_CACHE.user.staleTime,
    });
  }, [queryClient, setStatus]);

  const user =
    status === AuthStatus.Unauthenticated ? null : (query.data ?? null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      refresh,
    }),
    [user, status, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      'useAuth must be used within <AuthProvider>. Check your app root providers.',
    );
  }
  return ctx;
}

/** 편의 훅: 로그인 상태 boolean만 필요할 때 */
export function useIsAuthenticated(): boolean {
  return useAuth().status === AuthStatus.Authenticated;
}
