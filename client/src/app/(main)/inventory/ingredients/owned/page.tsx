'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IngredientGrid, IngredientRemoveButton } from '@/components/inventory';
import {
  inventoryQueries,
  useMyInventory,
} from '@/lib/queries/inventory.queries';
import { removeMyOwnedIngredient } from '@/lib/api/domains';
import type { InventoryIngredient } from '@/lib/types/inventory';
import { InventoryPageShell } from '../../InventoryPageShell';

export default function InventoryOwnedIngredientsPage() {
  const { data } = useMyInventory();
  const queryClient = useQueryClient();

  const [localItems, setLocalItems] = useState<InventoryIngredient[]>([]);
  const localItemsRef = useRef<InventoryIngredient[]>([]);
  const initializedRef = useRef(false);
  localItemsRef.current = localItems;

  useEffect(() => {
    if (data && !initializedRef.current) {
      setLocalItems(data.ownedIngredients);
      initializedRef.current = true;
    }
  }, [data]);

  const removeMutation = useMutation<
    void,
    Error,
    number,
    { removedItem: InventoryIngredient | undefined }
  >({
    mutationFn: (id: number) => removeMyOwnedIngredient(id),
    onMutate: (ingredientId) => {
      const items = localItemsRef.current;
      const removedItem = items.find((i) => i.id === ingredientId);
      setLocalItems(items.filter((i) => i.id !== ingredientId));
      return { removedItem };
    },
    onError: (_err, _id, context) => {
      if (context?.removedItem) {
        setLocalItems((prev) => [...prev, context.removedItem!]);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: inventoryQueries.all,
        refetchType: 'none',
      });
    },
  });

  const items = localItems;
  const addHref = '/ingredient/filter?type=owned';

  return (
    <InventoryPageShell
      tab="ownedIngredients"
      isEmpty={items.length === 0}
      infoScreenProps={{
        title: '보유 재료가 없습니다',
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
