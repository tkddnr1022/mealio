'use client';

import { IngredientGrid, IngredientRemoveButton } from '@/components/inventory';
import {
  useMyInventory,
  useRemoveMyOwnedIngredient,
} from '@/lib/queries/inventory.queries';
import { InventoryPageShell } from '../../InventoryPageShell';

export function InventoryOwnedIngredientsClientPage() {
  const { data } = useMyInventory();
  const removeMutation = useRemoveMyOwnedIngredient();

  const items = data?.ownedIngredients ?? [];
  const addHref = '/ingredient/filter?type=owned';

  return (
    <InventoryPageShell
      tab="ownedIngredients"
      isEmpty={items.length === 0}
      infoScreenProps={{
        title: '보유 재료가 없어요',
        message: '가지고 있는 재료를 추가해 보세요',
        buttonLabel: '재료 추가',
        buttonHref: addHref,
      }}
      addHref={addHref}
    >
      <IngredientGrid
        items={items}
        getTrailing={(ingredient) => (
          <IngredientRemoveButton
            ingredientName={ingredient.name}
            onRemove={() => removeMutation.mutate(ingredient.id)}
          />
        )}
      />
    </InventoryPageShell>
  );
}
