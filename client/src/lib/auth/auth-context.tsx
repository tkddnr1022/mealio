'use client';

/**
 * 클라이언트 전역 인증 상태 Provider.
 *
 * - `AuthStatus`는 localStorage(`status` 키)에 영속화되며, `Loading`은 비영속·파생 상태다.
 * - SSR·hydration 첫 렌더는 localStorage를 읽지 않고 `Unauthenticated`(또는 `initialUser` 시 Authenticated)로 맞춘다.
 * - mount 후 useEffect에서 localStorage의 `Authenticated`를 복원한다.
 * - `Unauthenticated`·localStorage 미설정(`null`)일 때는 `/me`를 호출하지 않는다.
 * - `Authenticated`(로그인 직후·localStorage 복원)에서만 `/me`를 fetch한다.
 * - 노출 `status`의 `Loading`은 `Authenticated` + 프로필 bootstrap 중(`query.isPending`)일 때만 파생된다.
 * - 유저 데이터 SSOT는 React Query 캐시(`userQueries.me`)이며, 본 Provider는 status·캐시를 동기화한다.
 * - OAuth 성공 후 `/oauth/callback`에서 `refresh()`로 Authenticated 마킹·`/me` 재조회 후 `next`로 이동한다.
 * - refresh 실패·로그아웃·SSR refresh 실패(`sessionExpired=1`)는 `auth-session` 브리지로 수렴한다.
 */

import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { QUERY_CACHE } from '@/lib/policy/cache.policy';
import { useCurrentUser, userQueries } from '@/lib/queries/user.queries';
import { logger } from '@/lib/utils/logger';

import {
  subscribeAuthSessionCleared,
} from './auth-session';
import { AuthStatus } from './auth-status';
import {
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

function resolveInitialStatus(initialUser?: SessionUser | null): AuthStatus {
  if (initialUser) {
    return AuthStatus.Authenticated;
  }
  // SSR·hydration 첫 렌더는 항상 Unauthenticated. localStorage 복원은 mount 후 useEffect.
  return AuthStatus.Unauthenticated;
}

export interface AuthProviderProps {
  children: ReactNode;
  /** 서버 컴포넌트에서 미리 조회한 유저(있으면 초기 상태로 사용) */
  initialUser?: SessionUser | null;
}

export function AuthProvider({
  children,
  initialUser,
}: AuthProviderProps): React.JSX.Element {
  const queryClient = useQueryClient();
  const [sessionStatus, setSessionStatus] = useState<AuthStatus>(() =>
    resolveInitialStatus(initialUser),
  );

  useEffect(() => {
    if (initialUser) return;
    const persisted = readPersistedAuthStatus();
    if (persisted === AuthStatus.Authenticated) {
      setSessionStatus(AuthStatus.Authenticated);
    }
  }, [initialUser]);

  const setStatus = useCallback((next: AuthStatus) => {
    setSessionStatus(next);
    if (
      next === AuthStatus.Authenticated ||
      next === AuthStatus.Unauthenticated
    ) {
      writePersistedAuthStatus(next);
    }
  }, []);

  const shouldFetchUser = sessionStatus === AuthStatus.Authenticated;

  const query = useCurrentUser({
    initialData: initialUser === undefined ? undefined : initialUser,
    enabled: shouldFetchUser,
  });

  const status =
    sessionStatus === AuthStatus.Authenticated &&
    query.isPending &&
    query.data === undefined
      ? AuthStatus.Loading
      : sessionStatus;

  useEffect(() => {
    if (!shouldFetchUser) return;

    if (query.isSuccess) {
      if (!query.data) {
        setStatus(AuthStatus.Unauthenticated);
        queryClient.setQueryData(userQueries.me(), null);
      }
      return;
    }

    if (query.isError) {
      logger.error('[AuthProvider] session query failed', {
        error: query.error,
      });
      setStatus(AuthStatus.Unauthenticated);
      queryClient.setQueryData(userQueries.me(), null);
    }
  }, [
    shouldFetchUser,
    query.isSuccess,
    query.isError,
    query.data,
    query.error,
    setStatus,
    queryClient,
  ]);

  useEffect(() => {
    return subscribeAuthSessionCleared(() => {
      setSessionStatus(AuthStatus.Unauthenticated);
      queryClient.setQueryData(userQueries.me(), null);
    });
  }, [queryClient]);

  const refresh = useCallback(async () => {
    setStatus(AuthStatus.Authenticated);
    await queryClient.fetchQuery({
      queryKey: userQueries.me(),
      queryFn: ({ signal }) => fetchCurrentUser({ signal }),
      staleTime: QUERY_CACHE.user.staleTime,
    });
  }, [queryClient, setStatus]);

  const user =
    sessionStatus === AuthStatus.Unauthenticated
      ? null
      : (query.data ?? null);

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
