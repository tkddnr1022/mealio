'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Info } from 'lucide-react';

import { InfoScreen } from '@/components/layout/InfoScreen';
import { HOME_PATH } from '@/lib/constants/routes.constants';
import { resolveErrorBoundaryMessage } from '@/lib/utils/resolveErrorBoundaryMessage';

interface RootErrorProps {
  error: Error & { digest?: string };
}

export default function RootError({ error }: RootErrorProps) {
  const message = resolveErrorBoundaryMessage(error);

  useEffect(() => {
    if (error.digest) return;
    Sentry.captureException(error, {
      tags: { boundary: 'root' },
    });
  }, [error]);

  return (
    <main className="flex h-full min-h-0 flex-1 items-center justify-center bg-background-primary-default px-4">
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
          buttonHref={HOME_PATH}
        />
      </div>
    </main>
  );
}
