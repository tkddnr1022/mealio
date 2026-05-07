import type { Metadata } from 'next';

import { RecipeMainClientPage } from './RecipeMainClientPage';
import { getRecipeList } from '@/lib/api/domains';

export const metadata: Metadata = {
  title: '레시피',
};

export const revalidate = 300;

const SECTION_SIZE = 12;

export default async function RecipeMainPage() {
  const listParams = {
    page: 1,
    size: SECTION_SIZE,
  } as const;

  const [viewedResult, likedResult] = await Promise.allSettled([
    getRecipeList({ ...listParams, sort: 'viewCount' }),
    getRecipeList({ ...listParams, sort: 'likeCount' }),
  ]);

  const mostViewedRecipes =
    viewedResult.status === 'fulfilled' ? viewedResult.value.data : [];

  const mostLikedRecipes =
    likedResult.status === 'fulfilled' ? likedResult.value.data : [];

  return (
    <RecipeMainClientPage
      mostViewedRecipes={mostViewedRecipes}
      mostLikedRecipes={mostLikedRecipes}
    />
  );
}
