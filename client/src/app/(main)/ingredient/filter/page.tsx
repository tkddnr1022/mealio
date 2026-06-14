import type { Metadata } from 'next';
import { Suspense } from 'react';

import { FullPageSuspenseFallback } from '@/components/layout/FullPageSuspenseFallback';
import { IngredientFilterClientPage } from './IngredientFilterClientPage';
import { getIngredientCategories } from '@/lib/api/domains';
import { fetchForIsr } from '@/lib/api/server';
import { createEmptyDataList } from '@/lib/utils/isr-fallback';
import type { IngredientCategory } from '@/lib/types/ingredient';

export const metadata: Metadata = {
  title: '재료 선택',
  description:
    '카테고리별로 재료를 찾아 보관함의 관심·보유 재료로 추가할 수 있습니다.',
};

export const revalidate = 300;

export default async function IngredientFilterPage() {
  const categoriesResult = await fetchForIsr({
    fetcher: () => getIngredientCategories(),
    fallback: createEmptyDataList<IngredientCategory>(),
  });
  const categories = categoriesResult.data;

  return (
    <Suspense fallback={<FullPageSuspenseFallback />}>
      <IngredientFilterClientPage categoryOptions={categories} />
    </Suspense>
  );
}
