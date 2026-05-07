import { RecipeFilterClientPage } from './RecipeFilterClientPage';
import { getRecipeCategories } from '@/lib/api/domains';

export const revalidate = 300;

export default async function RecipeFilterPage() {
  const { data: categories } = await getRecipeCategories();
  return <RecipeFilterClientPage categoryOptions={categories} />;
}
