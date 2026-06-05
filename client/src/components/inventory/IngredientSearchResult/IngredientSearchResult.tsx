import type { HTMLAttributes } from 'react';
import type { InventoryIngredient } from '@/lib/types/inventory';
import { cn } from '@/lib/utils/cn';
import { IngredientList } from '@/components/inventory/IngredientList';
import {
  IngredientListHeader,
  type IngredientListHeaderProps,
} from '@/components/inventory/IngredientListHeader';
import { toInventoryIngredientCountText } from '@/components/inventory/utils/inventory-format';

export interface IngredientSearchResultProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  items?: readonly InventoryIngredient[];
  headerProps?: Omit<IngredientListHeaderProps, 'countText'>;
  countText?: string;
  selectedIngredientIds?: readonly number[];
  getTrailing?: Parameters<typeof IngredientList>[0]['getTrailing'];
  onRemoveIngredient?: Parameters<
    typeof IngredientList
  >[0]['onRemoveIngredient'];
  onClickIngredient?: Parameters<typeof IngredientList>[0]['onClickIngredient'];
  itemClassName?: string;
}

export function IngredientSearchResult({
  className = '',
  items = [],
  headerProps,
  countText,
  selectedIngredientIds = [],
  getTrailing,
  onRemoveIngredient,
  onClickIngredient,
  itemClassName = '',
  ...rest
}: IngredientSearchResultProps) {
  const resolvedCountText =
    countText ?? toInventoryIngredientCountText(items.length);

  return (
    <section
      className={cn('card flex w-full flex-col items-start gap-3', className)}
      data-name="IngredientSearchResult"
      {...rest}
    >
      <IngredientListHeader {...headerProps} countText={resolvedCountText} />
      <IngredientList
        items={items}
        selectedIngredientIds={selectedIngredientIds}
        getTrailing={getTrailing}
        onRemoveIngredient={onRemoveIngredient}
        onClickIngredient={onClickIngredient}
        itemClassName={itemClassName}
      />
    </section>
  );
}
