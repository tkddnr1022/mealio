import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface FlatTagProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'children'
> {
  className?: string;
  label?: string;
  leftIcon?: ReactNode;
  trailing?: ReactNode;
}

export function FlatTag({
  className = '',
  label,
  leftIcon,
  trailing,
  ...rest
}: FlatTagProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-background-primary px-3 py-2 style-text-secondary',
        className,
      )}
      data-name="FlatTag"
      {...rest}
    >
      {leftIcon}
      <span className="typo-caption-regular">{label}</span>
      {trailing}
    </div>
  );
}
