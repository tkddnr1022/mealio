'use client';

import { useEffect } from 'react';

import { AuthStatus, useAuth } from '@/lib/auth/auth-context';
import { setAnalyticsContext } from '@/lib/observability/analytics';

/**
 * 로그인 유저 ID를 analytics 전역 컨텍스트에 반영한다.
 * `AuthProvider` 하위에서만 마운트한다.
 */
export function AnalyticsAuthSync() {
  const { user, status } = useAuth();

  useEffect(() => {
    if (status === AuthStatus.Authenticated && user) {
      setAnalyticsContext({
        userId: String(user.id),
      });
      return;
    }
    if (
      status === AuthStatus.Unauthenticated ||
      status === AuthStatus.Loading
    ) {
      setAnalyticsContext({ userId: undefined });
    }
  }, [status, user]);

  return null;
}
