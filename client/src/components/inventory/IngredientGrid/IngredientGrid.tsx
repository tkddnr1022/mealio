import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  IngredientCard,
  type IngredientCardProps,
} from '@/components/inventory/IngredientCard';

export type IngredientGridItem = Readonly<
  IngredientCardProps & {
    id: string | number;
  }
>;

export interface IngredientGridProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  items: readonly IngredientGridItem[];
  cardClassName?: string;
}

export function IngredientGrid({
  className = '',
  items,
  cardClassName = '',
  ...rest
}: IngredientGridProps) {
  return (
    <div
      className={cn('grid w-full grid-cols-4 gap-4', className)}
      data-name="IngredientGrid"
      {...rest}
    >
      {items.map((item) => {
        const { id, className: itemClassName = '', ...cardProps } = item;
        return (
          <IngredientCard
            key={id}
            {...cardProps}
            className={cn(cardClassName, itemClassName)}
          />
        );
      })}
    </div>
  );
}
