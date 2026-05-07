'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { AuthStatus, useAuth } from './auth-context';
import { buildLoginUrl } from './routes';

type ProtectedAction = (() => void) | (() => Promise<void>);

function buildCurrentUrl(
  pathname: string | null,
  searchParams: { toString: () => string } | null,
): string {
  if (!pathname) return '';
  const qs = searchParams?.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/**
 * 인증이 필요한 사용자 액션을 보호한다.
 *
 * - authenticated: 전달받은 액션 실행
 * - unauthenticated: 현재 URL을 `next`로 포함해 로그인 페이지로 이동
 * - loading: 아무 동작도 수행하지 않음
 */
export function useProtectedAction() {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const runProtectedAction = useCallback(
    async (action: ProtectedAction) => {
      if (status === AuthStatus.Loading) return;

      if (status === AuthStatus.Unauthenticated) {
        const currentUrl = buildCurrentUrl(pathname, searchParams);
        router.push(buildLoginUrl(currentUrl));
        return;
      }

      await action();
    },
    [status, pathname, searchParams, router],
  );

  return {
    runProtectedAction,
    isAuthenticating: status === AuthStatus.Loading,
    isAuthenticated: status === AuthStatus.Authenticated,
  };
}
