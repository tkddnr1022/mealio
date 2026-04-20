'use client';

/**
 * 앱 루트에서 합성되는 전역 Provider 묶음.
 *
 * 사용: `app/layout.tsx`에서 클라이언트 트리 최상단에 한 번 감싼다.
 * - 서버 컴포넌트에서 미리 조회한 세션이 있다면 `initialUser`로 주입하여
 *   하이드레이션 시 세션 깜빡임을 줄인다.
 *
 * 포함 Provider:
 * 1. {@link AppQueryClientProvider} — React Query
 * 2. {@link AuthProvider} — 전역 인증 상태
 *
 * Provider 순서는 내부에서 서로 의존하지 않으므로 중요하지 않지만,
 * AuthProvider가 React Query 캐시를 읽을 가능성에 대비해 QueryClient를 바깥에 둔다.
 */

import type { ReactNode } from 'react';

import { AuthProvider } from '@/lib/auth/auth-context';
import type { SessionUser } from '@/lib/auth/session';

import { AppQueryClientProvider } from './query-client.provider';

export interface RootProvidersProps {
  children: ReactNode;
  /** 서버 컴포넌트에서 미리 조회한 현재 유저 (로그인 상태 프리렌더용) */
  initialUser?: SessionUser | null;
}

export function RootProviders({
  children,
  initialUser,
}: RootProvidersProps): React.JSX.Element {
  return (
    <AppQueryClientProvider>
      <AuthProvider initialUser={initialUser}>{children}</AuthProvider>
    </AppQueryClientProvider>
  );
}
