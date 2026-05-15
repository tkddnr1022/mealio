import type { Metadata } from 'next';
import { Suspense } from 'react';

import { FullPageSuspenseFallback } from '@/components/layout/FullPageSuspenseFallback';
import { IngredientFilterClientPage } from './IngredientFilterClientPage';
import { getIngredientCategories } from '@/lib/api/domains';

export const metadata: Metadata = {
  title: '재료 선택',
  description:
    '카테고리별로 재료를 찾아 보관함의 관심·보유 재료로 추가할 수 있습니다.',
};

export const revalidate = 300;

export default async function IngredientFilterPage() {
  const categoriesResult = await Promise.allSettled([
    getIngredientCategories(),
  ]);
  const categories =
    categoriesResult[0]?.status === 'fulfilled'
      ? categoriesResult[0].value.data
      : [];

  return (
    <Suspense fallback={<FullPageSuspenseFallback />}>
      <IngredientFilterClientPage categoryOptions={categories} />
    </Suspense>
  );
}
