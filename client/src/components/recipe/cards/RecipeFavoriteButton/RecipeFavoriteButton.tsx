'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { LikeButton } from '@/components/ui/buttons/LikeButton';
import { useProtectedAction } from '@/lib/auth/protected-action';
import {
  AnalyticsEventProps,
  AnalyticsEvents,
} from '@/lib/observability/analytics-events';
import { trackEvent } from '@/lib/observability/analytics';
import { useToggleMyFavoriteRecipe } from '@/lib/queries/inventory.queries';
import { usePathname } from 'next/navigation';

export interface RecipeFavoriteButtonProps {
  recipeId: number;
  isFavorite?: boolean;
  className?: string;
}

const SOFT_LOCK_DEBOUNCE_MS = 200;

export function RecipeFavoriteButton({
  recipeId,
  isFavorite = false,
  className = '',
}: RecipeFavoriteButtonProps) {
  return (
    <Suspense
      fallback={
        <LikeButton className={className} isFavorite={isFavorite} disabled />
      }
    >
      <RecipeFavoriteButtonInner
        recipeId={recipeId}
        isFavorite={isFavorite}
        className={className}
      />
    </Suspense>
  );
}

function RecipeFavoriteButtonInner({
  recipeId,
  isFavorite = false,
  className = '',
}: RecipeFavoriteButtonProps) {
  const currentUrl = usePathname();
  const [localFavorite, setLocalFavorite] = useState(isFavorite);
  const toggleFavorite = useToggleMyFavoriteRecipe({ meta: { currentUrl } });
  const { runProtectedAction, isAuthenticating } = useProtectedAction();
  const inFlightRef = useRef(false);
  const queuedIntentRef = useRef<boolean | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalFavorite(isFavorite);
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
        isFavorite: !intent,
      });
      trackEvent(
        intent ? AnalyticsEvents.RECIPE_SAVED : AnalyticsEvents.RECIPE_UNSAVED,
        { [AnalyticsEventProps.RECIPE_ID]: recipeId },
      );
    } catch {
      setLocalFavorite(isFavorite);
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
