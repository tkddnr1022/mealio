import { Info } from 'lucide-react';

import { InfoScreen } from '@/components/layout/InfoScreen';

export default function NotFoundPage() {
  return (
    <main className="flex h-full min-h-0 flex-1 items-center justify-center bg-background-primary-default px-4">
      <div className="w-full max-w-(--layout-content-max-width)">
        <InfoScreen
          title="오류가 발생했습니다"
          message="Not Found"
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
  );
}
