'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { RecipeList } from '@/components/recipe/lists/RecipeList';
import { LikeButton } from '@/components/ui/buttons/LikeButton';
import {
  favoriteRecipeQueries,
  inventoryQueries,
  useMyInventory,
} from '@/lib/queries/inventory.queries';
import { removeMyFavoriteRecipe } from '@/lib/api/domains';
import type { InventoryFavoriteRecipe } from '@/lib/types/inventory';
import type { RecipeSummary } from '@/lib/types/recipe';
import { InventoryPageShell } from '../../InventoryPageShell';

function toRecipeSummary(recipe: InventoryFavoriteRecipe): RecipeSummary {
  return {
    ...recipe,
    description: recipe.description ?? '',
    likeCount: 0,
  };
}

export default function InventoryFavoriteRecipesPage() {
  const { data } = useMyInventory();
  const queryClient = useQueryClient();

  const [localRecipes, setLocalRecipes] = useState<InventoryFavoriteRecipe[]>(
    [],
  );
  const localRecipesRef = useRef<InventoryFavoriteRecipe[]>([]);
  const initializedRef = useRef(false);
  localRecipesRef.current = localRecipes;

  useEffect(() => {
    if (data && !initializedRef.current) {
      setLocalRecipes(data.favoriteRecipes);
      initializedRef.current = true;
    }
  }, [data]);

  const removeMutation = useMutation<
    void,
    Error,
    number,
    { removedItem: InventoryFavoriteRecipe | undefined }
  >({
    mutationFn: (recipeId: number) => removeMyFavoriteRecipe(recipeId),
    onMutate: (recipeId) => {
      const items = localRecipesRef.current;
      const removedItem = items.find((r) => r.id === recipeId);
      setLocalRecipes(items.filter((r) => r.id !== recipeId));
      return { removedItem };
    },
    onError: (_err, _id, context) => {
      if (context?.removedItem) {
        setLocalRecipes((prev) => [...prev, context.removedItem!]);
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: inventoryQueries.all,
        refetchType: 'none',
      });
      void queryClient.invalidateQueries({
        queryKey: favoriteRecipeQueries.all,
        refetchType: 'none',
      });
    },
  });

  const recipes = useMemo(
    () => localRecipes.map(toRecipeSummary),
    [localRecipes],
  );

  const addHref = '/recipe/filter';

  return (
    <InventoryPageShell
      tab="favoriteRecipes"
      isEmpty={localRecipes.length === 0}
      infoScreenProps={{
        title: '관심 레시피가 없습니다',
        message: '즐겨 찾는 레시피를 추가해 보세요',
        buttonLabel: '레시피 추가',
        buttonHref: addHref,
      }}
      addHref={addHref}
    >
      <RecipeList
        recipes={recipes}
        favoriteButtonRenderer={(recipe) => (
          <LikeButton
            isFavorite
            onClick={() => removeMutation.mutate(recipe.id)}
          />
        )}
      />
    </InventoryPageShell>
  );
}
