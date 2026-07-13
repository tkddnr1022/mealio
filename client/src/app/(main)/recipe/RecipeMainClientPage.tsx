'use client';

import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { SearchBarHeader } from '@/components/layout/SearchBarHeader';
import { Tabbar } from '@/components/layout/Tabbar';
import { RecipeSection } from '@/components/recipe';

import { AuthStatus, useAuth } from '@/lib/auth/auth-context';
import { useRecommendedRecipes } from '@/lib/queries/recipe.queries';
import type { RecipeSummary } from '@/lib/types/recipe';
import { usePathname } from 'next/navigation';

export interface RecipeMainClientPageProps {
  latestRecipes: readonly RecipeSummary[];
  mostViewedRecipes: readonly RecipeSummary[];
  mostLikedRecipes: readonly RecipeSummary[];
}

export function RecipeMainClientPage({
  latestRecipes,
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

      <SearchBarHeader
        href="/recipe/filter"
        searchBarProps={{ placeholder: '레시피 검색하기' }}
      />

      <MainContent paddingX={false}>
        {showRecommendedSection ? (
          <RecipeSection
            title="맞춤 레시피"
            recipes={recommendedRecipes}
            layout={{ columns: 2, rows: 1 }}
          />
        ) : null}

        <RecipeSection
          title="새로운 레시피"
          recipes={latestRecipes}
          emptyFallback={
            <p className="typo-body-regular px-4 style-text-caption">
              표시할 레시피가 없어요.
            </p>
          }
        />

        <RecipeSection
          title="많이 본 레시피"
          recipes={mostViewedRecipes}
          emptyFallback={
            <p className="typo-body-regular px-4 style-text-caption">
              표시할 레시피가 없어요.
            </p>
          }
        />

        <RecipeSection
          title="좋아요 많은 레시피"
          recipes={mostLikedRecipes}
          emptyFallback={
            <p className="typo-body-regular px-4 style-text-caption">
              표시할 레시피가 없어요.
            </p>
          }
        />
      </MainContent>

      <Tabbar />
    </>
  );
}
