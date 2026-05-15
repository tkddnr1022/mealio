import type { HTMLAttributes } from 'react';

import { buildAriaLabel } from '@/lib/utils/a11y';
import { cn } from '@/lib/utils/cn';

const sizeClassName = {
  sm: 'size-6 border-2',
  md: 'size-8 border-[3px]',
  lg: 'size-10 border-4',
} as const;

export interface SpinnerProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children' | 'aria-label'
> {
  size?: keyof typeof sizeClassName;
  /** 보조 공학용 짧은 한국어 문구 (`buildAriaLabel('generic', …)`에 전달, `decorative`일 때 무시) */
  label?: string;
  /** true면 장식만 하며 이름·역할을 노출하지 않음(부모 영역에 라벨이 있을 때) */
  decorative?: boolean;
}

export function Spinner({
  size = 'md',
  label = '불러오는 중',
  decorative = false,
  className = '',
  role,
  ...rest
}: SpinnerProps) {
  return (
    <div
      role={decorative ? undefined : (role ?? 'status')}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : buildAriaLabel('generic', label)}
      className={cn(
        'shrink-0 rounded-full border-primary-inactive border-t-primary-default animate-spin',
        sizeClassName[size],
        className,
      )}
      data-name="Spinner"
      {...rest}
    />
  );
}
