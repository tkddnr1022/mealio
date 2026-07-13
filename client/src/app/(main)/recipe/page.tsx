import type { Metadata } from 'next';

import { RecipeMainClientPage } from './RecipeMainClientPage';
import { getRecipeList } from '@/lib/api/domains';
import { fetchForIsr } from '@/lib/api/server';
import { ISR_RECIPE_LIST_FETCH } from '@/lib/policy/cache.policy';
import { createEmptyPaginated } from '@/lib/utils/isr-fallback';
import type { RecipeSummary } from '@/lib/types/recipe';

export const metadata: Metadata = {
  title: '레시피',
  description:
    '최신·조회수·좋아요 기준 레시피를 둘러보고, 맞춤 추천을 받을 수 있습니다.',
};

const SECTION_SIZE = 12;

export default async function RecipeMainPage() {
  const listParams = {
    page: 1,
    size: SECTION_SIZE,
  } as const;

  const [latestResult, viewedResult, likedResult] = await Promise.all([
    fetchForIsr({
      fetcher: () =>
        getRecipeList({ ...listParams, sort: 'latest' }, ISR_RECIPE_LIST_FETCH),
      fallback: createEmptyPaginated<RecipeSummary>(),
    }),
    fetchForIsr({
      fetcher: () =>
        getRecipeList({ ...listParams, sort: 'viewCount' }, ISR_RECIPE_LIST_FETCH),
      fallback: createEmptyPaginated<RecipeSummary>(),
    }),
    fetchForIsr({
      fetcher: () =>
        getRecipeList({ ...listParams, sort: 'likeCount' }, ISR_RECIPE_LIST_FETCH),
      fallback: createEmptyPaginated<RecipeSummary>(),
    }),
  ]);

  const latestRecipes = latestResult.data;
  const mostViewedRecipes = viewedResult.data;
  const mostLikedRecipes = likedResult.data;

  return (
    <RecipeMainClientPage
      latestRecipes={latestRecipes}
      mostViewedRecipes={mostViewedRecipes}
      mostLikedRecipes={mostLikedRecipes}
    />
  );
}
