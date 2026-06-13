'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';

import { FullPageSuspenseFallback } from '@/components/layout/FullPageSuspenseFallback';
import { useAuth } from '@/lib/auth/auth-context';
import {
  DEFAULT_POST_LOGIN_PATH,
  NEXT_QUERY_PARAM,
  resolveSafeNextPath,
} from '@/lib/auth/routes';

function OAuthCallbackPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refresh } = useAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const nextPath = resolveSafeNextPath(
      searchParams.get(NEXT_QUERY_PARAM),
      DEFAULT_POST_LOGIN_PATH,
    );

    void (async () => {
      await refresh();
      router.replace(nextPath);
    })();
  }, [refresh, router, searchParams]);

  return <FullPageSuspenseFallback />;
}

export function OAuthCallbackClientPage() {
  return (
    <Suspense fallback={<FullPageSuspenseFallback />}>
      <OAuthCallbackPageContent />
    </Suspense>
  );
}
