'use client';

import { useEffect } from 'react';
import { Info } from 'lucide-react';

import { InfoScreen } from '@/components/layout/InfoScreen';
import { resolveErrorBoundaryMessage } from '@/lib/utils/resolveErrorBoundaryMessage';

import './globals.css';

interface GlobalErrorProps {
  error: Error & { digest?: string };
}

export default function GlobalError({ error }: GlobalErrorProps) {
  const message = resolveErrorBoundaryMessage(error);

  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="ko">
      <body className="antialiased">
        <div className="flex h-screen w-full justify-center">
          <div className="flex size-full max-w-[400px] flex-col overflow-hidden">
            <main className="flex min-h-0 flex-1 flex-col items-center justify-center bg-background-primary-default px-4">
              <div className="w-full max-w-(--layout-content-max-width)">
                <InfoScreen
                  title="오류가 발생했어요"
                  message={message}
                  icon={
                    <Info
                      className="size-8 text-text-accent"
                      strokeWidth={2}
                      aria-hidden
                    />
                  }
                  buttonLabel="홈으로 돌아가기"
                  buttonHref="/"
                />
              </div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
