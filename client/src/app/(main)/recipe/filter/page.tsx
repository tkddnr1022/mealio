import type { Metadata } from 'next';
import { Suspense } from 'react';

import { FullPageSuspenseFallback } from '@/components/layout/FullPageSuspenseFallback';
import { RecipeFilterClientPage } from './RecipeFilterClientPage';
import { getRecipeCategories } from '@/lib/api/domains';
import { fetchForIsr } from '@/lib/api/server';
import { createEmptyDataList } from '@/lib/utils/isr-fallback';
import type { RecipeCategory } from '@/lib/types/recipe';

export const metadata: Metadata = {
  title: '레시피 필터',
  description:
    '카테고리·난이도·조리 시간 등 조건으로 레시피를 좁혀 찾아보세요.',
};

export const revalidate = 300;

export default async function RecipeFilterPage() {
  const categoriesResult = await fetchForIsr({
    fetcher: () => getRecipeCategories(),
    fallback: createEmptyDataList<RecipeCategory>(),
  });
  const categories = categoriesResult.data;

  return (
    <Suspense fallback={<FullPageSuspenseFallback />}>
      <RecipeFilterClientPage categoryOptions={categories} />
    </Suspense>
  );
}
