'use client';

/**
 * 클라이언트 전역 인증 상태 Provider.
 *
 * - 상태 SSOT은 **React Query 캐시**(`userQueries.me`)이며, 본 Provider는 그 위의 얇은
 *   어댑터다: 상태 관리(useState/useEffect)를 별도로 두지 않아 중복 소스를 제거한다.
 * - `GET /api/v1/users/me`를 `fetchCurrentUser`로 호출하며 비로그인(401)은 `null`로 정규화된다.
 * - 초기 유저(`initialUser`)를 주입하면 서버 컴포넌트에서 미리 조회한 세션을
 *   `initialData`로 하이드레이션해 깜빡임을 줄인다.
 * - `loginWithProvider`는 백엔드 OAuth 진입 URL로 브라우저를 이동시킨다(리다이렉트 기반 플로우).
 */

import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';

import { useCurrentUser, userQueries } from '@/lib/queries/user.queries';
import { logger } from '@/lib/utils/logger';

import { buildOAuthEntryUrl } from './providers';
import type { SessionUser } from './session';
import type { OAuthProvider } from './providers';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: SessionUser | null;
  status: AuthStatus;
  /** 서버에서 최신 세션을 다시 조회한다. (예: 닉네임 변경 후) */
  refresh: () => Promise<void>;
  /**
   * 소셜 로그인 진입 — 백엔드 진입 URL로 브라우저를 이동시킨다.
   * (Authorization Code 교환은 백엔드에서 수행)
   */
  loginWithProvider: (provider: OAuthProvider) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

  const query = useCurrentUser({
    initialData: initialUser === undefined ? undefined : initialUser,
  });

  if (query.isError) {
    // 비로그인(401)은 fetchCurrentUser가 null로 정규화하므로 여기 도달하지 않는다.
    // 따라서 이 분기는 네트워크·서버 오류(5xx 등)만을 표시한다.
    logger.error('[AuthProvider] session query failed', {
      error: query.error,
    });
  }

  const status: AuthStatus = query.isSuccess
    ? query.data
      ? 'authenticated'
      : 'unauthenticated'
    : query.isError
      ? 'unauthenticated'
      : 'loading';

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: userQueries.me() });
  }, [queryClient]);

  const loginWithProvider = useCallback((provider: OAuthProvider) => {
    if (typeof window === 'undefined') return;
    window.location.assign(buildOAuthEntryUrl(provider));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: query.data ?? null,
      status,
      refresh,
      loginWithProvider,
    }),
    [query.data, status, refresh, loginWithProvider],
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
  return useAuth().status === 'authenticated';
}
