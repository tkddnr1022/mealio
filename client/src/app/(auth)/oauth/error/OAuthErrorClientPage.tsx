'use client';

import { AlertTriangle } from 'lucide-react';

import { InfoScreen } from '@/components/layout/InfoScreen';

interface OAuthErrorClientPageProps {
  code: string;
  message: string;
  loginHref: string;
}

export function OAuthErrorClientPage({
  code,
  message,
  loginHref,
}: OAuthErrorClientPageProps) {
  return (
    <main className="flex h-full min-h-0 flex-1 items-center justify-center bg-background-primary-default px-4">
      <div className="w-full max-w-(--layout-content-max-width)">
        <InfoScreen
          title="로그인에 실패했습니다"
          message={`${message} (code: ${code})`}
          icon={
            <AlertTriangle
              className="size-8 text-text-accent"
              strokeWidth={2}
              aria-hidden
            />
          }
          buttonLabel="로그인으로 돌아가기"
          buttonHref={loginHref}
        />
      </div>
    </main>
  );
}
