import { RecipeFilterClientPage } from './RecipeFilterClientPage';
import { getRecipeCategories } from '@/lib/api/domains';

export const revalidate = 300;

export default async function RecipeFilterPage() {
  const categoriesResult = await Promise.allSettled([getRecipeCategories()]);
  const categories =
    categoriesResult[0]?.status === 'fulfilled'
      ? categoriesResult[0].value.data
      : [];

  return <RecipeFilterClientPage categoryOptions={categories} />;
}
