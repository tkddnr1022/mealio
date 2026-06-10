'use client';

import { Clock3, Flame, Users } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { Tabbar } from '@/components/layout/Tabbar';
import { RecipeDetailContent, RecipeFavoriteButton } from '@/components/recipe';
import { ShareButton } from '@/components/ui/buttons/ShareButton';
import { Thumbnail } from '@/components/ui/Thumbnail';
import type { CardTagItem } from '@/components/ui/CardTagsRow';
import type { HashTagItem } from '@/components/ui/HashTagsRow';
import { buildRecipeSearchHref } from '@/components/recipe/utils/recipe-search-filters';
import { buildAriaLabel } from '@/lib/utils/a11y';
import { useIsAuthenticated } from '@/lib/auth/auth-context';
import { useMyFavoriteRecipeIds } from '@/lib/queries/inventory.queries';
import { increaseRecipeViewCount } from '@/lib/api/domains';
import type { RecipeDetail } from '@/lib/types/recipe';
import {
  AnalyticsEventProps,
  AnalyticsEvents,
} from '@/lib/observability/analytics-events';
import { trackEvent } from '@/lib/observability/analytics';
import { hasSentRecipeView, markRecipeViewSent } from './recipe-view-tracking';
import {
  toRecipeCookingTimeLabel,
  toRecipeDifficultyLabel,
  toRecipeImageUrl,
  toRecipeServingsLabel,
} from '@/components/recipe/utils/recipe-format';

interface RecipeDetailClientPageProps {
  recipe: RecipeDetail;
}

function buildRecipeClassificationHashTags(
  recipe: RecipeDetail,
): HashTagItem[] {
  const items: HashTagItem[] = [];
  const categoryLabel = recipe.categoryName?.trim();
  if (categoryLabel) {
    items.push({
      label: categoryLabel,
      href: buildRecipeSearchHref({ categoryId: recipe.categoryId }),
    });
  }
  const cookingMethod = recipe.cookingMethod?.trim();
  if (cookingMethod) {
    items.push({
      label: cookingMethod,
      href: buildRecipeSearchHref({ q: cookingMethod }),
    });
  }
  const dishType = recipe.dishType?.trim();
  if (dishType) {
    items.push({
      label: dishType,
      href: buildRecipeSearchHref({ q: dishType }),
    });
  }
  return items;
}

function buildRecipeMetaTags(recipe: RecipeDetail): CardTagItem[] {
  const items: CardTagItem[] = [
    {
      label: toRecipeCookingTimeLabel(recipe.cookTime),
      leftIcon: <Clock3 className="size-5" aria-hidden />,
    },
    {
      label: toRecipeDifficultyLabel(recipe.difficulty),
      leftIcon: <Flame className="size-5" aria-hidden />,
    },
    {
      label: toRecipeServingsLabel(recipe.servings),
      leftIcon: <Users className="size-5" aria-hidden />,
    },
  ];

  return items;
}

async function copyCurrentUrl(): Promise<void> {
  if (typeof window === 'undefined') return;
  const href = window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({ url: href });
      return;
    } catch {
      // 사용자가 공유 UI를 닫은 경우를 포함해 클립보드 fallback으로 진행
    }
  }

  try {
    await navigator.clipboard.writeText(href);
  } catch {
    // 클립보드 권한이 없으면 무시
  }
}

export function RecipeDetailClientPage({
  recipe,
}: RecipeDetailClientPageProps) {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const currentUrl = usePathname();
  const { data: favoriteIdsData } = useMyFavoriteRecipeIds({
    enabled: isAuthenticated,
    meta: {
      currentUrl,
    },
  });

  const isFavorite = useMemo(() => {
    if (!isAuthenticated || !favoriteIdsData) return false;
    return new Set(favoriteIdsData.favoriteRecipeIds).has(recipe.id);
  }, [isAuthenticated, favoriteIdsData, recipe.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      if (hasSentRecipeView(window.sessionStorage, recipe.id)) {
        return;
      }
      markRecipeViewSent(window.sessionStorage, recipe.id);
    } catch {
      // sessionStorage 접근 불가 환경에서는 서버 dedupe 정책에 위임한다.
    }

    void increaseRecipeViewCount(recipe.id);
    trackEvent(AnalyticsEvents.RECIPE_VIEWED, {
      [AnalyticsEventProps.RECIPE_ID]: recipe.id,
    });
  }, [recipe.id]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Navbar
        displayBackButton
        displayTitle={false}
        onBack={() => router.back()}
        additionalButtons={
          <div className="flex items-center gap-2">
            <RecipeFavoriteButton
              recipeId={recipe.id}
              isFavorite={isFavorite}
            />
            <ShareButton onClick={() => void copyCurrentUrl()} />
          </div>
        }
      />

      <MainContent paddingX={false} paddingY={false}>
        <div className="flex w-full flex-col">
          <Thumbnail
            square={false}
            imageUrl={toRecipeImageUrl(recipe.imageUrl)}
            imageAlt={buildAriaLabel('image', recipe.title)}
          />

          <RecipeDetailContent
            headerProps={{
              title: recipe.title,
              description: recipe.description ?? '',
            }}
            hashTags={buildRecipeClassificationHashTags(recipe)}
            metaTags={buildRecipeMetaTags(recipe)}
            ingredientsCardProps={{ ingredients: recipe.ingredients }}
            nutritionCardProps={{ nutrition: recipe.nutrition }}
            tipsCardProps={{ tip: recipe.cookingTip }}
            stepsCardProps={{
              steps: recipe.instructions,
              stepImageAlt: recipe.title,
            }}
          />
        </div>
      </MainContent>

      <Tabbar activeId="recipe" />
    </div>
  );
}
