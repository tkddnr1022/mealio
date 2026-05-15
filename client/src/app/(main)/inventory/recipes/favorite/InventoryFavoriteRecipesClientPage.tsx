'use client';

import { useMemo } from 'react';
import { RecipeList } from '@/components/recipe/lists/RecipeList';
import { LikeButton } from '@/components/ui/buttons/LikeButton';
import {
  useMyInventory,
  useRemoveMyFavoriteRecipe,
} from '@/lib/queries/inventory.queries';
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

export function InventoryFavoriteRecipesClientPage() {
  const { data } = useMyInventory();
  const removeMutation = useRemoveMyFavoriteRecipe();

  const recipes = useMemo(() => {
    const favoriteRecipes = data?.favoriteRecipes ?? [];
    return favoriteRecipes.map(toRecipeSummary);
  }, [data?.favoriteRecipes]);

  const addHref = '/recipe/filter';

  return (
    <InventoryPageShell
      tab="favoriteRecipes"
      isEmpty={recipes.length === 0}
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
