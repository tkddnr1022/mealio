'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';

import { LoginButtonList, LoginFooter, LoginHeader } from '@/components/auth';
import { Navbar } from '@/components/layout/Navbar';
import { FullPageSuspenseFallback } from '@/components/layout/FullPageSuspenseFallback';
import { NEXT_QUERY_PARAM, SESSION_EXPIRED_QUERY_PARAM } from '@/lib/auth/routes';
import { notifyApiError } from '@/lib/toast';
import { ApiError } from '@/lib/api/error';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const oauthNext = searchParams.get(NEXT_QUERY_PARAM);
  const isSessionExpired = searchParams.get(SESSION_EXPIRED_QUERY_PARAM) === '1';
  const router = useRouter();

  useEffect(() => {
    if (isSessionExpired) {
      notifyApiError(new ApiError({
        status: 401,
        message: '세션이 만료되었어요',
        code: 'SESSION_EXPIRED',
      }), {
        title: '세션이 만료되었어요',
        message: '다시 로그인해주세요',
      });
    }
  }, [isSessionExpired]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background-primary-default">
      <Navbar
        displayBackButton
        displayTitle={false}
        // TODO: 이전 페이지가 외부 링크(OAuth 로그인)인 경우 대응
        onBack={() => router.back()}
      />

      <main className="flex min-h-0 flex-1 flex-col px-4 py-6">
        <div className="flex min-h-0 flex-1 flex-col items-center gap-8">
          <LoginHeader className="w-full" />

          <LoginButtonList
            className="w-full max-w-full"
            oauthNext={oauthNext}
          />

          <LoginFooter
            className="w-full"
            leftLink={{ label: '이용약관', href: '/terms' }}
            rightLink={{ label: '개인정보 처리방침', href: '/privacy' }}
          />
        </div>
      </main>
    </div>
  );
}

export function LoginClientPage() {
  return (
    <Suspense fallback={<FullPageSuspenseFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}
