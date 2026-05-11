import type { HTMLAttributes } from 'react';
import type { InventoryIngredient } from '@/lib/types/inventory';
import { cn } from '@/lib/utils/cn';
import {
  IngredientCard,
  type IngredientCardProps,
} from '@/components/inventory/IngredientCard';

export interface IngredientGridProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  items: readonly InventoryIngredient[];
  selectedIngredientIds?: readonly number[];
  getTrailing?: (
    ingredient: InventoryIngredient,
  ) => IngredientCardProps['trailing'];
  onRemoveIngredient?: (ingredient: InventoryIngredient) => void;
  onClickIngredient?: (ingredient: InventoryIngredient) => void;
  cardClassName?: string;
}

export function IngredientGrid({
  className = '',
  items,
  selectedIngredientIds = [],
  getTrailing,
  onRemoveIngredient,
  onClickIngredient,
  cardClassName = '',
  ...rest
}: IngredientGridProps) {
  const isClickable = onClickIngredient != null;

  return (
    <div
      className={cn('grid w-full grid-cols-4 gap-4', className)}
      data-name="IngredientGrid"
      {...rest}
    >
      {items.map((item) => {
        return (
          <IngredientCard
            key={item.id}
            ingredient={item}
            selected={selectedIngredientIds.includes(item.id)}
            trailing={getTrailing?.(item)}
            onRemove={
              onRemoveIngredient ? () => onRemoveIngredient(item) : undefined
            }
            className={cn(isClickable && 'cursor-pointer', cardClassName)}
            {...(isClickable
              ? {
                  role: 'button',
                  tabIndex: 0,
                  onClick: () => onClickIngredient(item),
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onClickIngredient(item);
                    }
                  },
                }
              : undefined)}
          />
        );
      })}
    </div>
  );
}
