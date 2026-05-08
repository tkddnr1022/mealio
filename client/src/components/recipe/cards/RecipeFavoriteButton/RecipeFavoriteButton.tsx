'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { LikeButton } from '@/components/ui/buttons/LikeButton';
import { useProtectedAction } from '@/lib/auth/protected-action';
import { useToggleMyFavoriteRecipe } from '@/lib/queries/inventory.queries';

export interface RecipeFavoriteButtonProps {
  recipeId: number;
  isFavorite?: boolean;
  className?: string;
  onToggled?: (nextIsFavorite: boolean) => void;
}

const SOFT_LOCK_DEBOUNCE_MS = 200;

export function RecipeFavoriteButton({
  recipeId,
  isFavorite = false,
  className = '',
  onToggled,
}: RecipeFavoriteButtonProps) {
  return (
    <Suspense
      fallback={
        <LikeButton
          className={className}
          isFavorite={isFavorite}
          disabled
        />
      }
    >
      <RecipeFavoriteButtonInner
        recipeId={recipeId}
        isFavorite={isFavorite}
        className={className}
        onToggled={onToggled}
      />
    </Suspense>
  );
}

function RecipeFavoriteButtonInner({
  recipeId,
  isFavorite = false,
  className = '',
  onToggled,
}: RecipeFavoriteButtonProps) {
  const [localFavorite, setLocalFavorite] = useState(isFavorite);
  const toggleFavorite = useToggleMyFavoriteRecipe();
  const { runProtectedAction, isAuthenticating } = useProtectedAction();
  const serverConfirmedFavoriteRef = useRef(isFavorite);
  const inFlightRef = useRef(false);
  const queuedIntentRef = useRef<boolean | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalFavorite(isFavorite);
    serverConfirmedFavoriteRef.current = isFavorite;
  }, [isFavorite]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const flushQueuedIntent = async () => {
    const intent = queuedIntentRef.current;
    if (intent === null || inFlightRef.current) return;

    queuedIntentRef.current = null;
    inFlightRef.current = true;

    try {
      await toggleFavorite.mutateAsync({
        recipeId,
        // API 계약: isFavorite은 "현재 서버 상태"를 의미한다.
        isFavorite: !intent,
      });
      serverConfirmedFavoriteRef.current = intent;
    } catch {
      const rollbackValue = serverConfirmedFavoriteRef.current;
      setLocalFavorite(rollbackValue);
      onToggled?.(rollbackValue);
    } finally {
      inFlightRef.current = false;
      if (queuedIntentRef.current !== null) {
        flushQueuedIntent();
      }
    }
  };

  const scheduleFlush = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      flushQueuedIntent();
    }, SOFT_LOCK_DEBOUNCE_MS);
  };

  const handleClick = () => {
    const nextValue = !localFavorite;
    setLocalFavorite(nextValue);
    onToggled?.(nextValue);
    queuedIntentRef.current = nextValue;
    scheduleFlush();
  };

  return (
    <LikeButton
      className={className}
      isFavorite={localFavorite}
      disabled={isAuthenticating}
      onClick={() => runProtectedAction(handleClick)}
    />
  );
}
