import { Info } from 'lucide-react';

import { InfoScreen } from '@/components/layout/InfoScreen';

export default function NotFound() {
  return (
    <main className="flex h-full min-h-0 flex-1 items-center justify-center bg-background-primary-default px-4">
      <div className="w-full max-w-(--layout-content-max-width)">
        <InfoScreen
          title="페이지를 찾을 수 없습니다"
          message="요청하신 페이지가 없거나 이동되었습니다."
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
