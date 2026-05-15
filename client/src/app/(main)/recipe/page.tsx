import type { Metadata } from 'next';

import { RecipeMainClientPage } from './RecipeMainClientPage';
import { getRecipeList } from '@/lib/api/domains';

export const metadata: Metadata = {
  title: '레시피',
  description:
    '조회수·좋아요 기준 인기 레시피를 둘러보고, 맞춤 추천을 받을 수 있습니다.',
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
