import { X } from 'lucide-react';
import { type HTMLAttributes, type ReactNode } from 'react';
import type { InventoryIngredient } from '@/lib/types/inventory';
import { cn } from '@/lib/utils/cn';
import { Checkbox } from '@/components/ui/Checkbox';
import { toInventoryIngredientRemoveAriaLabel } from '@/components/inventory/utils/inventory-format';

export interface IngredientItemRemoveButtonProps {
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function IngredientItemRemoveButton({
  ariaLabel,
  className,
  disabled,
  onClick,
}: IngredientItemRemoveButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'absolute top-1/2 right-4 inline-flex size-8 -translate-y-1/2 items-center justify-center p-1.5 style-text-secondary transition-colors hover:style-text-primary focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default',
        className,
      )}
    >
      <X className="size-full" strokeWidth={2} aria-hidden />
    </button>
  );
}

export interface IngredientItemProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'children'
> {
  className?: string;
  ingredient: InventoryIngredient;
  selected?: boolean;
  trailing?: ReactNode;
  onRemove?: () => void;
}

export function IngredientItem({
  className = '',
  ingredient,
  selected = false,
  trailing,
  onRemove,
  ...rest
}: IngredientItemProps) {
  const categoryLabel = ingredient.categoryName?.trim() ?? '';
  const removeButtonAriaLabel =
    onRemove !== undefined
      ? toInventoryIngredientRemoveAriaLabel(ingredient)
      : undefined;

  const defaultTrailing = selected ? (
    <Checkbox
      selected
      tabIndex={-1}
      aria-hidden
      className="absolute top-1/2 right-4 -translate-y-1/2"
    />
  ) : onRemove && removeButtonAriaLabel ? (
    <IngredientItemRemoveButton
      ariaLabel={removeButtonAriaLabel}
      onClick={onRemove}
    />
  ) : null;

  return (
    <div
      className={cn(
        'relative flex w-full items-center gap-4 p-4',
        selected
          ? 'bg-accent-default'
          : 'border-b border-border-subtle bg-background-surface',
        className,
      )}
      data-name="IngredientItem"
      data-selected={selected ? 'true' : 'false'}
      {...rest}
    >
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <p className="w-full wrap-break-word typo-card-heading style-text-primary">
          {ingredient.name}
        </p>
        {categoryLabel ? (
          <p className="w-full typo-card-caption style-text-secondary">
            {categoryLabel}
          </p>
        ) : null}
      </div>
      {trailing ?? defaultTrailing}
    </div>
  );
}
