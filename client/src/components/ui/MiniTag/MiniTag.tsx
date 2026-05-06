import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface MiniTagProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  label?: string;
}

export function MiniTag({ className = '', label, ...rest }: MiniTagProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg bg-background-primary px-2 py-1',
        className,
      )}
      data-name="MiniTag"
      {...rest}
    >
      <span className="typo-card-caption style-text-secondary">{label}</span>
    </div>
  );
}
