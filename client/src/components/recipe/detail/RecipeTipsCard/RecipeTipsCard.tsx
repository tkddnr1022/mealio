import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface RecipeTipsCardProps extends Omit<
  HTMLAttributes<HTMLElement>,
  'children'
> {
  className?: string;
  title?: string;
  tip?: string | null;
}

export function RecipeTipsCard({
  className = '',
  title = '조리 팁',
  tip = null,
  ...rest
}: RecipeTipsCardProps) {
  const trimmed = tip?.trim();
  if (!trimmed) {
    return null;
  }

  return (
    <section
      className={cn('card flex w-full flex-col gap-3', className)}
      data-name="RecipeTipsCard"
      {...rest}
    >
      <h2 className="typo-h2 style-text-primary">{title}</h2>
      <p className="typo-body-regular style-text-primary">{trimmed}</p>
    </section>
  );
}
