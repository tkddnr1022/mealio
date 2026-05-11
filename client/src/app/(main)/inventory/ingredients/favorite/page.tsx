'use client';

import { IngredientSearchResult } from '@/components/inventory';
import {
  useMyInventory,
  useRemoveMyFavoriteIngredient,
} from '@/lib/queries/inventory.queries';
import { InventoryPageShell } from '../../InventoryPageShell';

export default function InventoryFavoriteIngredientsPage() {
  const { data } = useMyInventory();
  const removeMutation = useRemoveMyFavoriteIngredient();

  const items = data?.favoriteIngredients ?? [];

  const addHref = '/';

  return (
    <InventoryPageShell
      tab="favoriteIngredients"
      isEmpty={items.length === 0}
      infoScreenProps={{
        title: '관심 재료가 없습니다',
        message: '즐겨 찾는 재료를 추가해 보세요',
        buttonLabel: '재료 추가',
        buttonHref: addHref,
      }}
      addHref={addHref}
    >
      <IngredientSearchResult
        items={items}
        onRemoveIngredient={(ingredient) => {
          removeMutation.mutate(ingredient.id);
        }}
      />
    </InventoryPageShell>
  );
}
