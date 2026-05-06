import { RecipeFilterClientPage } from './RecipeFilterClientPage';
import { getRecipeCategoriesPublicForPage } from '@/lib/api/recipes.server';

export const revalidate = 300;

export default async function RecipeFilterPage() {
  const categoryOptions = await getRecipeCategoriesPublicForPage();
  return <RecipeFilterClientPage categoryOptions={categoryOptions} />;
}
