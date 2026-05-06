'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { LoginButtonList, LoginFooter, LoginHeader } from '@/components/auth';
import { Navbar } from '@/components/layout/Navbar';
import { NEXT_QUERY_PARAM } from '@/lib/auth/routes';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthNext = searchParams.get(NEXT_QUERY_PARAM);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background-primary-default">
      <Navbar variant="BackOnly" onBack={() => router.back()} />

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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-background-primary-default px-4">
          <p className="typo-body-regular style-text-caption" aria-busy="true">
            불러오는 중…
          </p>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
