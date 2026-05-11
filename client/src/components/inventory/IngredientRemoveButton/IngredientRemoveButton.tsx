'use client';

import { Suspense } from 'react';
import { X } from 'lucide-react';
import { useProtectedAction } from '@/lib/auth/protected-action';
import { toInventoryIngredientRemoveAriaLabel } from '@/components/inventory/utils/inventory-format';

export interface IngredientRemoveButtonProps {
  ingredientName: string;
  className?: string;
  onRemove?: () => void;
}

function RemoveButton({
  disabled,
  ariaLabel,
  className = '',
  onClick,
}: {
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={`absolute top-2 right-2 inline-flex size-6 items-center justify-center rounded-full bg-background-primary style-text-secondary transition-colors hover:style-text-primary focus-visible:outline-(length:--border-width-focus) focus-visible:outline-offset-2 focus-visible:outline-primary-default disabled:pointer-events-none disabled:opacity-40 ${className}`}
    >
      <X className="size-4" strokeWidth={2.25} aria-hidden />
    </button>
  );
}

export function IngredientRemoveButton({
  ingredientName,
  className = '',
  onRemove,
}: IngredientRemoveButtonProps) {
  const ariaLabel = toInventoryIngredientRemoveAriaLabel({
    name: ingredientName,
  });

  return (
    <Suspense fallback={<RemoveButton ariaLabel={ariaLabel} disabled />}>
      <IngredientRemoveButtonInner
        ariaLabel={ariaLabel}
        className={className}
        onRemove={onRemove}
      />
    </Suspense>
  );
}

function IngredientRemoveButtonInner({
  ariaLabel,
  className = '',
  onRemove,
}: {
  ariaLabel: string;
  className?: string;
  onRemove?: () => void;
}) {
  const { runProtectedAction, isAuthenticating } = useProtectedAction();

  return (
    <RemoveButton
      ariaLabel={ariaLabel}
      className={className}
      disabled={isAuthenticating}
      onClick={() => runProtectedAction(() => onRemove?.())}
    />
  );
}
