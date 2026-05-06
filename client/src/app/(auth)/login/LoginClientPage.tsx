'use client';

import { useRouter } from 'next/navigation';
import { LoginButtonList, LoginFooter, LoginHeader } from '@/components/auth';
import { Navbar } from '@/components/layout/Navbar';

interface LoginClientPageProps {
  oauthNext: string | null;
}

export function LoginClientPage({ oauthNext }: LoginClientPageProps) {
  const router = useRouter();

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
