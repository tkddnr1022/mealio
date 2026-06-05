import type { HTMLAttributes } from 'react';
import type { InventoryIngredient } from '@/lib/types/inventory';
import { cn } from '@/lib/utils/cn';
import {
  IngredientItem,
  type IngredientItemProps,
} from '@/components/inventory/IngredientItem';

export interface IngredientListProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  items: readonly InventoryIngredient[];
  selectedIngredientIds?: readonly number[];
  getTrailing?: (
    ingredient: InventoryIngredient,
  ) => IngredientItemProps['trailing'];
  onRemoveIngredient?: (ingredient: InventoryIngredient) => void;
  onClickIngredient?: (ingredient: InventoryIngredient) => void;
  itemClassName?: string;
}

export function IngredientList({
  className = '',
  items,
  selectedIngredientIds = [],
  getTrailing,
  onRemoveIngredient,
  onClickIngredient,
  itemClassName = '',
  ...rest
}: IngredientListProps) {
  const isClickable = onClickIngredient != null;

  return (
    <div
      className={cn('flex w-full flex-col', className)}
      data-name="IngredientList"
      {...rest}
    >
      {items.map((item) => {
        return (
          <IngredientItem
            key={item.id}
            ingredient={item}
            selected={selectedIngredientIds.includes(item.id)}
            trailing={getTrailing?.(item)}
            onRemove={
              onRemoveIngredient ? () => onRemoveIngredient(item) : undefined
            }
            className={cn(isClickable && 'cursor-pointer', itemClassName)}
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
