import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RecipeDetailClientPage } from './RecipeDetailClientPage';
import { getRecipeById, getRecipeList } from '@/lib/api/domains';
import { isApiError } from '@/lib/api/error';

interface RecipeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const revalidate = 300;
const STATIC_PARAMS_SIZE = 100;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  try {
    const result = await getRecipeList({
      page: 1,
      size: STATIC_PARAMS_SIZE,
      sort: 'latest',
    });

    return result.data.map((recipe) => ({ id: String(recipe.id) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: RecipeDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const recipeId = Number.parseInt(resolvedParams.id, 10);

  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return { title: '레시피 상세' };
  }

  try {
    const recipe = await getRecipeById(recipeId);
    return { title: recipe.title };
  } catch {
    return { title: '레시피 상세' };
  }
}

export default async function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const resolvedParams = await params;
  const recipeId = Number.parseInt(resolvedParams.id, 10);

  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    notFound();
  }

  try {
    const recipe = await getRecipeById(recipeId);
    return <RecipeDetailClientPage recipe={recipe} />;
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      notFound();
    }

    throw error;
  }
}
