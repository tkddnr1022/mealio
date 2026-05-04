'use client';

import { useRouter } from 'next/navigation';

import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { SearchBarHeader } from '@/components/layout/SearchBarHeader';
import { Tabbar } from '@/components/layout/Tabbar';
import {
  type RecipeGridItem,
  RecipeSection,
  RecipeSlider,
} from '@/components/recipe';

import { PersonalizedRecipeSection } from './PersonalizedRecipeSection';

export interface RecipeMainPageClientProps {
  mostViewedRecipes: readonly RecipeGridItem[];
  mostLikedRecipes: readonly RecipeGridItem[];
}

export function RecipeMainPageClient({
  mostViewedRecipes,
  mostLikedRecipes,
}: RecipeMainPageClientProps) {
  const router = useRouter();

  return (
    <>
      <Navbar variant="Empty" />

      <SearchBarHeader
        searchBarProps={{ placeholder: '검색어를 입력해 주세요' }}
        onClick={() => {
          router.push('/recipe/search');
        }}
      />

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

        <PersonalizedRecipeSection />
      </MainContent>

      <Tabbar />
    </>
  );
}
