import { Suspense } from 'react';
import { IngredientFilterClientPage } from './IngredientFilterClientPage';
import { getIngredientCategories } from '@/lib/api/domains';

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
    <Suspense fallback={null}>
      <IngredientFilterClientPage categoryOptions={categories} />
    </Suspense>
  );
}
