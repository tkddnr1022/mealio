import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface BaseRowProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'className'
> {
  className?: string;
}

/**
 * 토글/태그 묶음용 유동 행 컨테이너.
 * Figma BaseRow 높이(85px)를 최소 높이로 유지하고, 줄바꿈 가능한 래핑 레이아웃을 제공한다.
 */
export function BaseRow({ className = '', children, ...rest }: BaseRowProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-wrap content-start items-start gap-3',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
