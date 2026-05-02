'use client';

import { useEffect } from 'react';
import { Info } from 'lucide-react';

import { InfoScreen } from '@/components/layout/InfoScreen';

interface GlobalErrorPageProps {
  error: Error & { digest?: string };
}

function resolveErrorMessage(error: Error & { digest?: string }): string {
  const raw = `${error.name} ${error.message} ${error.digest ?? ''}`.toLowerCase();

  if (raw.includes('not found') || raw.includes('404')) {
    return 'Not Found';
  }
  if (
    raw.includes('401') ||
    raw.includes('403') ||
    raw.includes('unauthorized') ||
    raw.includes('forbidden')
  ) {
    return '접근 권한이 없습니다';
  }
  if (
    raw.includes('network') ||
    raw.includes('fetch') ||
    raw.includes('timeout') ||
    raw.includes('ecconn')
  ) {
    return '네트워크 상태를 확인한 뒤 다시 시도해 주세요';
  }
  return '일시적인 오류가 발생했습니다';
}

export default function GlobalErrorPage({ error }: GlobalErrorPageProps) {
  const message = resolveErrorMessage(error);

  useEffect(() => {
    console.error('[GlobalErrorPage]', error);
  }, [error]);

  return (
    <main className="flex h-full min-h-0 flex-1 items-center justify-center bg-background-primary-default px-4">
      <div className="w-full max-w-(--layout-content-max-width)">
        <InfoScreen
          title="오류가 발생했습니다"
          message={message}
          icon={<Info className="size-8 text-text-accent" strokeWidth={2} aria-hidden />}
          buttonLabel="홈으로 돌아가기"
          buttonHref="/"
        />
      </div>
    </main>
  );
}
