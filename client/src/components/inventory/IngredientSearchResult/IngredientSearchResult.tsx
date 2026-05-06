import type { HTMLAttributes } from 'react';
import type { InventoryIngredient } from '@/lib/types/inventory';
import { cn } from '@/lib/utils/cn';
import { IngredientGrid } from '@/components/inventory/IngredientGrid';
import {
  IngredientGridHeader,
  type IngredientGridHeaderProps,
} from '@/components/inventory/IngredientGridHeader';
import { toInventoryIngredientCountText } from '@/components/inventory/utils/inventory-format';

export interface IngredientSearchResultProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  items?: readonly InventoryIngredient[];
  headerProps?: Omit<IngredientGridHeaderProps, 'countText'>;
  countText?: string;
  selectedIngredientIds?: readonly number[];
  getLeadingIcon?: Parameters<typeof IngredientGrid>[0]['getLeadingIcon'];
  getTrailing?: Parameters<typeof IngredientGrid>[0]['getTrailing'];
  onRemoveIngredient?: Parameters<
    typeof IngredientGrid
  >[0]['onRemoveIngredient'];
  cardClassName?: string;
}

export function IngredientSearchResult({
  className = '',
  items = [],
  headerProps,
  countText,
  selectedIngredientIds = [],
  getLeadingIcon,
  getTrailing,
  onRemoveIngredient,
  cardClassName = '',
  ...rest
}: IngredientSearchResultProps) {
  const resolvedCountText =
    countText ?? toInventoryIngredientCountText(items.length);

  return (
    <section
      className={cn('flex w-full flex-col items-start gap-3', className)}
      data-name="IngredientSearchResult"
      {...rest}
    >
      <IngredientGridHeader {...headerProps} countText={resolvedCountText} />
      <IngredientGrid
        items={items}
        selectedIngredientIds={selectedIngredientIds}
        getLeadingIcon={getLeadingIcon}
        getTrailing={getTrailing}
        onRemoveIngredient={onRemoveIngredient}
        cardClassName={cardClassName}
      />
    </section>
  );
}
