'use client';

import { Suspense } from 'react';
import { IngredientItemRemoveButton } from '@/components/inventory/IngredientItem';
import { useProtectedAction } from '@/lib/auth/protected-action';
import { toInventoryIngredientRemoveAriaLabel } from '@/components/inventory/utils/inventory-format';

export interface IngredientRemoveButtonProps {
  ingredientName: string;
  className?: string;
  onRemove?: () => void;
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
    <Suspense
      fallback={<IngredientItemRemoveButton ariaLabel={ariaLabel} disabled />}
    >
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
    <IngredientItemRemoveButton
      ariaLabel={ariaLabel}
      className={className}
      disabled={isAuthenticating}
      onClick={() => runProtectedAction(() => onRemove?.())}
    />
  );
}
