'use client';

import { useEffect, useState } from 'react';
import { LikeButton } from '@/components/ui/buttons/LikeButton';
import { useProtectedAction } from '@/lib/auth/protected-action';
import { useToggleMyFavoriteRecipe } from '@/lib/queries/inventory.queries';

export interface RecipeFavoriteButtonProps {
  recipeId: number;
  isFavorite?: boolean;
  className?: string;
  onToggled?: (nextIsFavorite: boolean) => void;
}

export function RecipeFavoriteButton({
  recipeId,
  isFavorite = false,
  className = '',
  onToggled,
}: RecipeFavoriteButtonProps) {
  const [localFavorite, setLocalFavorite] = useState(isFavorite);
  const toggleFavorite = useToggleMyFavoriteRecipe();
  const { runProtectedAction, isAuthenticating } = useProtectedAction();

  useEffect(() => {
    setLocalFavorite(isFavorite);
  }, [isFavorite]);

  const handleClick = async () => {
    if (toggleFavorite.isPending) return;

    await toggleFavorite.mutateAsync({
      recipeId,
      isFavorite: localFavorite,
    });

    const nextValue = !localFavorite;
    setLocalFavorite(nextValue);
    onToggled?.(nextValue);
  };

  return (
    <LikeButton
      className={className}
      isFavorite={localFavorite}
      disabled={toggleFavorite.isPending || isAuthenticating}
      onClick={() => {
        void runProtectedAction(handleClick);
      }}
    />
  );
}
