import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { SearchBarHeader } from '@/components/layout/SearchBarHeader';
import { Tabbar } from '@/components/layout/Tabbar';
import { RecipeSection, RecipeSlider } from '@/components/recipe';

import type { RecipeSummary } from '@/lib/types/recipe';

export interface RecipeMainClientPageProps {
  mostViewedRecipes: readonly RecipeSummary[];
  mostLikedRecipes: readonly RecipeSummary[];
}

export function RecipeMainClientPage({
  mostViewedRecipes,
  mostLikedRecipes,
}: RecipeMainClientPageProps) {
  return (
    <>
      <Navbar />

      <SearchBarHeader href="/recipe/filter" />

      <MainContent paddingX={false}>
        <RecipeSection title="많이 본 레시피">
          {mostViewedRecipes.length > 0 ? (
            <RecipeSlider recipes={mostViewedRecipes} />
          ) : (
            <p className="typo-body-regular px-4 style-text-caption">
              표시할 레시피가 없습니다.
            </p>
          )}
        </RecipeSection>

        <RecipeSection title="좋아요 많은 레시피">
          {mostLikedRecipes.length > 0 ? (
            <RecipeSlider recipes={mostLikedRecipes} />
          ) : (
            <p className="typo-body-regular px-4 style-text-caption">
              표시할 레시피가 없습니다.
            </p>
          )}
        </RecipeSection>

        {/*
        // TODO: 맞춤 레시피 추가 
        */}
      </MainContent>

      <Tabbar />
    </>
  );
}
