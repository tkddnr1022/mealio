'use client';

import { useMemo, useState } from 'react';

import { MainContent } from '@/components/layout/MainContent';
import { Navbar } from '@/components/layout/Navbar';
import {
  TABBAR_TAB_IDS,
  Tabbar,
  type TabbarTabId,
} from '@/components/layout/Tabbar';
import type { RecipeGridItem } from '@/components/ui/RecipeGrid';
import { RecipeSlider } from '@/components/ui/RecipeSlider';
import { SearchBarHeader } from '@/components/ui/SearchBarHeader';

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
    id: `recipe-${seed}-${i + 1}`,
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
  const [activeTab, setActiveTab] = useState<TabbarTabId>('recipe');
  const recommendedRecipes = useMemo(() => buildRecipes(0), []);
  const recentRecipes = useMemo(() => buildRecipes(5), []);

  return (
    <>
      <Navbar title="레시피" variant="Empty" />

      <SearchBarHeader searchBarProps={{ placeholder: "검색어를 입력해 주세요" }} />

      <MainContent paddingX={false}>
        <section className="flex flex-col gap-4">
          <div className="px-4">
            <h2>추천 레시피</h2>
          </div>
          <RecipeSlider recipes={recommendedRecipes} />
        </section>

        <section className="flex flex-col gap-4">
          <div className="px-4">
            <h2>추천 레시피</h2>
          </div>
          <RecipeSlider recipes={recentRecipes} />
        </section>
      </MainContent>

      <Tabbar
        activeId={activeTab}
        onSelect={(id) =>
          setActiveTab(TABBAR_TAB_IDS.includes(id) ? id : 'recipe')
        }
      />
    </>
  );
}
