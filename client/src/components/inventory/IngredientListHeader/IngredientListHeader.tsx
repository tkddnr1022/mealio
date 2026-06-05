import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface IngredientListHeaderProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  title?: string;
  countText?: string;
}

export function IngredientListHeader({
  className = '',
  title = '재료 선택',
  countText = '0개의 재료',
  ...rest
}: IngredientListHeaderProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center justify-between whitespace-nowrap',
        className,
      )}
      data-name="IngredientListHeader"
      {...rest}
    >
      <h3 className="typo-card-heading style-text-primary">{title}</h3>
      <p className="typo-caption-regular style-text-placeholder">{countText}</p>
    </div>
  );
}
