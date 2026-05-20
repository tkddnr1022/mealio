'use client';

import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { SearchBarHeader } from '@/components/layout/SearchBarHeader';
import { Tabbar } from '@/components/layout/Tabbar';
import { RecipeSection, RecipeSlider } from '@/components/recipe';

import { AuthStatus, useAuth } from '@/lib/auth/auth-context';
import { useRecommendedRecipes } from '@/lib/queries/recipe.queries';
import type { RecipeSummary } from '@/lib/types/recipe';
import { usePathname } from 'next/navigation';

export interface RecipeMainClientPageProps {
  mostViewedRecipes: readonly RecipeSummary[];
  mostLikedRecipes: readonly RecipeSummary[];
}

export function RecipeMainClientPage({
  mostViewedRecipes,
  mostLikedRecipes,
}: RecipeMainClientPageProps) {
  const currentUrl = usePathname();
  const { status } = useAuth();
  const isAuthenticated = status === AuthStatus.Authenticated;
  const { data: recommendedData, isPending: isRecommendedPending } =
    useRecommendedRecipes(undefined, {
      enabled: isAuthenticated,
      meta: { currentUrl },
    });
  const recommendedRecipes =
    recommendedData?.data.map((item) => item.recipe) ?? [];
  const showRecommendedSection =
    isAuthenticated && !isRecommendedPending && recommendedRecipes.length > 0;

  return (
    <>
      <Navbar />

      <SearchBarHeader href="/recipe/filter" />

      <MainContent paddingX={false}>
        {showRecommendedSection ? (
          <RecipeSection title="맞춤 레시피">
            <RecipeSlider recipes={recommendedRecipes} />
          </RecipeSection>
        ) : null}

        <RecipeSection title="많이 본 레시피">
          {mostViewedRecipes.length > 0 ? (
            <RecipeSlider recipes={mostViewedRecipes} />
          ) : (
            <p className="typo-body-regular px-4 style-text-caption">
              표시할 레시피가 없어요.
            </p>
          )}
        </RecipeSection>

        <RecipeSection title="좋아요 많은 레시피">
          {mostLikedRecipes.length > 0 ? (
            <RecipeSlider recipes={mostLikedRecipes} />
          ) : (
            <p className="typo-body-regular px-4 style-text-caption">
              표시할 레시피가 없어요.
            </p>
          )}
        </RecipeSection>
      </MainContent>

      <Tabbar />
    </>
  );
}
