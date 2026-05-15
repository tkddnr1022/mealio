'use client';

import type { HTMLAttributes } from 'react';

import { MainContent } from '@/components/layout/MainContent';
import { Spinner } from '@/components/ui/Spinner';
import type { SpinnerProps } from '@/components/ui/Spinner';
import { buildAriaLabel } from '@/lib/utils/a11y';
import { cn } from '@/lib/utils/cn';

export interface FullPageSuspenseFallbackProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'aria-label'
> {
  spinnerSize?: SpinnerProps['size'];
}

/**
 * 라우트·클라이언트 화면 전체를 채우는 `<Suspense>` 폴백.
 * `MainContent`로 본문 영역을 맞춘 뒤 가운데 `Spinner`를 둔다.
 */
export function FullPageSuspenseFallback({
  className = '',
  spinnerSize = 'md',
  ...rest
}: FullPageSuspenseFallbackProps) {
  return (
    <div
      className={cn('flex h-full min-h-0 flex-1 flex-col', className)}
      aria-busy="true"
      aria-live="polite"
      aria-label={buildAriaLabel('generic', '페이지 불러오는 중')}
      {...rest}
    >
      <MainContent centered scroll={false}>
        <Spinner decorative size={spinnerSize} />
      </MainContent>
    </div>
  );
}
