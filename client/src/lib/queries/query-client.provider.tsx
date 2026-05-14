'use client';

/**
 * React Query(TanStack Query v5) Provider.
 *
 * - SSR-safe: 서버에서는 요청마다 새 QueryClient를, 클라이언트에서는 싱글톤을 재사용한다.
 *   (Next.js App Router 권장 패턴)
 * - 전역 기본값은 `@/lib/config/cache.config`의 `QUERY_DEFAULTS`를 사용한다.
 * - 전역 오류 토스트: `QueryCache` / `MutationCache`의 `onError`에서
 *   {@link globalQueryCacheOnError} · {@link globalMutationCacheOnError} 호출.
 *   개별 쿼리는 `meta.suppressGlobalErrorToast` / `meta.errorToastTitle`로 조정한다.
 * - 개발 환경에서만 Devtools를 동적으로 로드해 프로덕션 번들을 늘리지 않는다.
 *
 * 사용: `client/src/app/layout.tsx`에서 `ToastProvider`·`AuthProvider`와 함께 트리 최상단에 둔다.
 */

import { useState, type ReactNode } from 'react';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { QUERY_DEFAULTS } from '@/lib/config/cache.config';
import { env } from '@/lib/config/env';
import {
  globalMutationCacheOnError,
  globalQueryCacheOnError,
} from '@/lib/queries/global-query-error-toast';

const DEFAULT_CONFIG: QueryClientConfig = {
  queryCache: new QueryCache({
    onError: globalQueryCacheOnError,
  }),
  mutationCache: new MutationCache({
    onError: globalMutationCacheOnError,
  }),
  defaultOptions: {
    queries: {
      staleTime: QUERY_DEFAULTS.staleTime,
      gcTime: QUERY_DEFAULTS.gcTime,
      retry: QUERY_DEFAULTS.retry,
      refetchOnWindowFocus: QUERY_DEFAULTS.refetchOnWindowFocus,
    },
    mutations: {
      retry: 0,
    },
  },
};

function createQueryClient(): QueryClient {
  return new QueryClient(DEFAULT_CONFIG);
}

let browserClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // 서버: 매 요청마다 새 인스턴스를 만들어 요청 간 캐시 누수를 방지한다.
    return createQueryClient();
  }
  // 클라이언트: 최초 1회만 생성 후 재사용.
  if (!browserClient) browserClient = createQueryClient();
  return browserClient;
}

export interface QueryClientProviderProps {
  children: ReactNode;
}

export function AppQueryClientProvider({
  children,
}: QueryClientProviderProps): React.JSX.Element {
  const [client] = useState(() => getQueryClient());
  return (
    <QueryClientProvider client={client}>
      {children}
      {env.isProduction ? null : <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
