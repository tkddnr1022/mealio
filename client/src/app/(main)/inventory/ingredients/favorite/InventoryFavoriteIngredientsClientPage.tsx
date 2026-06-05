'use client';

import { IngredientList, IngredientRemoveButton } from '@/components/inventory';
import {
  useMyInventory,
  useRemoveMyFavoriteIngredient,
} from '@/lib/queries/inventory.queries';
import { InventoryPageShell } from '../../InventoryPageShell';
import { usePathname } from 'next/navigation';

export function InventoryFavoriteIngredientsClientPage() {
  const currentUrl = usePathname();
  const { data } = useMyInventory({
    meta: {
      currentUrl,
    },
  });
  const removeMutation = useRemoveMyFavoriteIngredient({
    meta: {
      currentUrl,
    },
  });

  const items = data?.favoriteIngredients ?? [];
  const addHref = '/ingredient/filter?type=favorites';

  return (
    <InventoryPageShell
      tab="favoriteIngredients"
      isEmpty={items.length === 0}
      infoScreenProps={{
        title: '관심 재료가 없어요',
        message: '즐겨 찾는 재료를 추가해 보세요',
        buttonLabel: '재료 추가',
        buttonHref: addHref,
      }}
      addHref={addHref}
    >
      <IngredientList
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
