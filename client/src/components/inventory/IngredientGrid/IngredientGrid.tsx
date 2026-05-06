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
  getLeadingIcon?: (ingredient: InventoryIngredient) => IngredientCardProps['leadingIcon'];
  getTrailing?: (ingredient: InventoryIngredient) => IngredientCardProps['trailing'];
  onRemoveIngredient?: (ingredient: InventoryIngredient) => void;
  cardClassName?: string;
}

export function IngredientGrid({
  className = '',
  items,
  selectedIngredientIds = [],
  getLeadingIcon,
  getTrailing,
  onRemoveIngredient,
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
        return (
          <IngredientCard
            key={item.id}
            ingredient={item}
            selected={selectedIngredientIds.includes(item.id)}
            leadingIcon={getLeadingIcon?.(item)}
            trailing={getTrailing?.(item)}
            onRemove={
              onRemoveIngredient
                ? () => onRemoveIngredient(item)
                : undefined
            }
            className={cn(cardClassName)}
          />
        );
      })}
    </div>
  );
}
