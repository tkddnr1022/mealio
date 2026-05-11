import { Check, X } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import type { InventoryIngredient } from '@/lib/types/inventory';
import { cn } from '@/lib/utils/cn';
import {
  getIngredientCategoryIcon,
  toInventoryIngredientRemoveAriaLabel,
} from '@/components/inventory/utils/inventory-format';

export interface IngredientCardProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  ingredient: InventoryIngredient;
  selected?: boolean;
  trailing?: ReactNode;
  onRemove?: () => void;
}

export function IngredientCard({
  className = '',
  ingredient,
  selected = false,
  trailing,
  onRemove,
  ...rest
}: IngredientCardProps) {
  const removeButtonAriaLabel =
    onRemove !== undefined
      ? toInventoryIngredientRemoveAriaLabel(ingredient)
      : undefined;

  const CategoryIcon = getIngredientCategoryIcon(ingredient.categoryId);

  const defaultTrailing = selected ? (
    <span
      aria-hidden
      className="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-full bg-toggle-selected-default style-text-button-primary"
    >
      <Check className="size-4" strokeWidth={2.25} aria-hidden />
    </span>
  ) : onRemove ? (
    <button
      type="button"
      onClick={onRemove}
      aria-label={removeButtonAriaLabel}
      className="absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-full bg-background-primary style-text-secondary transition-colors hover:style-text-primary focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default"
    >
      <X className="size-4" strokeWidth={2.25} aria-hidden />
    </button>
  ) : null;

  return (
    <div
      className={cn(
        'relative flex w-20 shrink-0 flex-col items-center gap-3 rounded-xl bg-background-surface p-4 shadow-(--semantic-shadow-md)',
        className,
      )}
      data-name="IngredientCard"
      {...rest}
    >
      <span
        aria-hidden
        className={cn(
          'inline-flex size-12 items-center justify-center rounded-full p-3',
          selected
            ? 'bg-toggle-selected-default style-text-button-primary'
            : 'bg-dropdown-selected-default style-text-accent',
        )}
      >
        <CategoryIcon className="size-5" strokeWidth={2} aria-hidden />
      </span>
      <p className="w-full truncate text-center typo-card-body style-text-primary">
        {ingredient.name}
      </p>
      {trailing ?? defaultTrailing}
    </div>
  );
}
