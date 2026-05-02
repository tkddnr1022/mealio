'use client';

import { useMemo } from 'react';

import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import { SearchBarHeader } from '@/components/layout/SearchBarHeader';
import { Tabbar } from '@/components/layout/Tabbar';
import {
  type RecipeGridItem,
  RecipeSection,
  RecipeSlider,
} from '@/components/recipe';

const images = [
  'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=640&h=640&fit=crop',
  'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=640&h=640&fit=crop',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=640&h=640&fit=crop',
  'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=640&h=640&fit=crop',
] as const;

function buildRecipes(seed: number): RecipeGridItem[] {
  const titles = [
    '치킨 카레',
    '토마토 파스타',
    '채소 샐러드',
    '버섯 스프',
    '김치볶음밥',
    '연어 포케',
    '에그 인 헬',
    '리조또',
    '마파두부',
    '감바스',
    '들깨 칼국수',
    '닭가슴살 샌드위치',
  ] as const;

  return Array.from({ length: 12 }, (_, i) => ({
    recipeId: `recipe-${seed}-${i + 1}`,
    imageUrl: images[(i + seed) % images.length] ?? images[0],
    title: titles[(i + seed) % titles.length] ?? `레시피 ${i + 1}`,
    cookingTime: `${20 + ((i + seed) % 6) * 5}분`,
    difficulty:
      (i + seed) % 3 === 0 ? '쉬움' : (i + seed) % 3 === 1 ? '보통' : '어려움',
    servings: `${2 + ((i + seed) % 3)}인분`,
    category: (i + seed) % 2 === 0 ? '아시안' : '양식',
  }));
}

export default function RecipeMainPage() {
  const recommendedRecipes = useMemo(() => buildRecipes(0), []);
  const recentRecipes = useMemo(() => buildRecipes(5), []);

  return (
    <>
      <Navbar variant="Empty" />

      <SearchBarHeader searchBarProps={{ placeholder: '검색어를 입력해 주세요' }} />

      <MainContent paddingX={false}>
        <RecipeSection title="추천 레시피">
          <RecipeSlider recipes={recommendedRecipes} />
        </RecipeSection>

        <RecipeSection title="최근 본 레시피">
          <RecipeSlider recipes={recentRecipes} />
        </RecipeSection>
      </MainContent>

      <Tabbar />
    </>
  );
}
