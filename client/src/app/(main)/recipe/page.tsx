import type { Metadata } from 'next';

import { getRecipeListPublicForPage } from '@/lib/api/recipes.server';
import { mapRecipeSummaryToGridItem } from '@/lib/utils/recipe-grid-item';

import { RecipeMainPageClient } from './RecipeMainPageClient';

export const metadata: Metadata = {
  title: '레시피',
};

/**
 * 레시피 메인(목록 하이라이트) — 명세 ISR 300s.
 * 공개 목록은 `getRecipeListPublicForPage`(쿠키 미사용)로만 조회한다.
 * Next.js는 `revalidate`를 빌드 타임에 정적으로 분석하므로 리터럴만 허용한다.
 * `ISR_REVALIDATE.recipeList`와 동일 값을 유지할 것 (`@/lib/config/cache.config`).
 */
export const revalidate = 300;

const SECTION_SIZE = 12;

export default async function RecipeMainPage() {
  const listParams = {
    page: 1,
    size: SECTION_SIZE,
  } as const;

  const [viewedResult, likedResult] = await Promise.allSettled([
    getRecipeListPublicForPage({ ...listParams, sort: 'viewCount' }),
    getRecipeListPublicForPage({ ...listParams, sort: 'likeCount' }),
  ]);

  const mostViewedRecipes =
    viewedResult.status === 'fulfilled'
      ? viewedResult.value.data.map(mapRecipeSummaryToGridItem)
      : [];

  const mostLikedRecipes =
    likedResult.status === 'fulfilled'
      ? likedResult.value.data.map(mapRecipeSummaryToGridItem)
      : [];

  return (
    <RecipeMainPageClient
      mostViewedRecipes={mostViewedRecipes}
      mostLikedRecipes={mostLikedRecipes}
    />
  );
}
