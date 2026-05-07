'use client';

/**
 * 보호 라우트 래퍼.
 *
 * 주된 접근 차단은 `client/src/proxy.ts`에서 수행되지만, 미들웨어는 쿠키 존재만
 * 확인하므로 실제 백엔드 검증 결과(만료된 토큰 등)는 통과시킬 수 있다. 이 컴포넌트는
 * 클라이언트에서 `useAuth()` 세션 검증 결과를 바탕으로 2차 방어를 수행한다.
 *
 * - `status === 'loading'`: `fallback`(기본 아무것도 렌더하지 않음).
 * - `status === 'unauthenticated'`: `/login`으로 리다이렉트하고, 현재 경로를 `next` 쿼리로 보존.
 * - `status === 'authenticated'`: 자식 렌더.
 */

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { AuthStatus, useAuth } from './auth-context';
import { LOGIN_PATH, NEXT_QUERY_PARAM } from './routes';

export interface ProtectedRouteProps {
  children: ReactNode;
  /** 비인증 시 리다이렉트할 경로. 기본값은 `@/lib/auth/routes`의 `LOGIN_PATH`. */
  redirectTo?: string;
  /** loading 상태에서 보여줄 UI (스켈레톤 등). 기본값 `null` */
  fallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  redirectTo = LOGIN_PATH,
  fallback = null,
}: ProtectedRouteProps): React.JSX.Element | null {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (status !== AuthStatus.Unauthenticated) return;

    const currentUrl = buildCurrentUrl(pathname, searchParams);
    const target = currentUrl
      ? `${redirectTo}?${NEXT_QUERY_PARAM}=${encodeURIComponent(currentUrl)}`
      : redirectTo;
    router.replace(target);
  }, [status, pathname, searchParams, router, redirectTo]);

  if (status === AuthStatus.Authenticated) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
}

function buildCurrentUrl(
  pathname: string | null,
  searchParams: { toString: () => string } | null,
): string {
  if (!pathname) return '';
  const qs = searchParams?.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
