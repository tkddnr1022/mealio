'use client';

/**
 * React Query(TanStack Query v5) Provider.
 *
 * - App Router 최상단 Provider에서 QueryClient를 1회 생성해 재사용한다.
 * - 전역 기본값은 `@/lib/config/cache.config`의 `QUERY_DEFAULTS`를 사용한다.
 * - 전역 오류 토스트: `QueryCache` / `MutationCache`의 `onError`에서
 *   {@link globalQueryCacheOnError} · {@link globalMutationCacheOnError} 호출.
 *   개별 쿼리는 `meta.suppressGlobalErrorToast` / `meta.errorToastTitle`로 조정한다.
 * - 401(`ApiError`)은 `meta.currentUrl` 기반으로 로그인 페이지로 공통 네비게이션한다.
 * - 개발 환경에서만 Devtools를 동적으로 로드해 프로덕션 번들을 늘리지 않는다.
 *
 * 사용: `client/src/app/layout.tsx`에서 `ToastProvider`·`AuthProvider`와 함께 트리 최상단에 둔다.
 */

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { isApiError } from '@/lib/api/error';
import { buildLoginUrl } from '@/lib/auth/routes';
import { QUERY_DEFAULTS } from '@/lib/config/cache.config';
import { env } from '@/lib/config/env';
import {
  globalMutationCacheOnError,
  globalQueryCacheOnError,
} from '@/lib/queries/global-query-error-toast';

type QueryMetaLike = { currentUrl?: string | null };

// TODO: 매번 meta에 currentUrl을 넘겨주어야 하는 문제
function resolveCurrentUrl(meta: unknown): string | null | undefined {
  if (!meta || typeof meta !== 'object') return undefined;
  const maybeCurrentUrl = (meta as QueryMetaLike).currentUrl;
  if (typeof maybeCurrentUrl === 'string') return maybeCurrentUrl;
  return maybeCurrentUrl ?? undefined;
}

function createQueryClient(
  handleUnauthorized: (error: unknown, meta: unknown) => boolean,
): QueryClient {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (handleUnauthorized(error, query.meta)) return;
        globalQueryCacheOnError(error as Error, query);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, variables, context, mutation) => {
        if (handleUnauthorized(error, mutation.meta)) return;
        globalMutationCacheOnError(
          error as Error,
          variables,
          context,
          mutation,
        );
      },
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
  });
}

export interface QueryClientProviderProps {
  children: ReactNode;
}

export function AppQueryClientProvider({
  children,
}: QueryClientProviderProps): React.JSX.Element {
  const router = useRouter();
  const [client] = useState(() =>
    createQueryClient((error, meta) => {
      if (!isApiError(error) || error.status !== 401) return false;

      const currentUrl = resolveCurrentUrl(meta);
      router.push(buildLoginUrl(currentUrl, true));
      return true;
    }),
  );

  return (
    <QueryClientProvider client={client}>
      {children}
      {env.isProduction ? null : <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
