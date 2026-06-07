import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RecipeDetailClientPage } from './RecipeDetailClientPage';
import { getRecipeById, getRecipeStaticIds } from '@/lib/api/domains';
import { isApiError } from '@/lib/api/error';
import { truncateForMeta } from '@/lib/metadata/meta-text';
import type { RecipeDetail } from '@/lib/types/recipe';

interface RecipeDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const revalidate = false;
const STATIC_PARAMS_SIZE = 100;

export async function generateStaticParams(): Promise<{ id: string }[]> {
  try {
    const result = await getRecipeStaticIds({
      size: STATIC_PARAMS_SIZE,
    });

    return result.data.map((id) => ({ id: String(id) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: RecipeDetailPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const recipeId = Number.parseInt(resolvedParams.id, 10);

  const fallback: Metadata = {
    title: '레시피 상세',
    description: '레시피 재료와 조리 단계를 확인하세요.',
  };

  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return fallback;
  }

  try {
    const recipe = await getRecipeById(recipeId);
    const rawDescription =
      recipe.description?.trim() ||
      `${recipe.title} 레시피 (${recipe.categoryName})의 재료·조리법 안내입니다.`;
    const description = truncateForMeta(rawDescription, 160);

    return {
      title: recipe.title,
      description,
      openGraph: {
        title: recipe.title,
        description,
        type: 'article',
        ...(recipe.imageUrl
          ? { images: [{ url: recipe.imageUrl, alt: recipe.title }] }
          : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title: recipe.title,
        description,
        ...(recipe.imageUrl ? { images: [recipe.imageUrl] } : {}),
      },
    };
  } catch {
    return fallback;
  }
}

export default async function RecipeDetailPage({
  params,
}: RecipeDetailPageProps) {
  const resolvedParams = await params;
  const recipeId = Number.parseInt(resolvedParams.id, 10);

  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    notFound();
  }

  let recipe: RecipeDetail;
  try {
    recipe = await getRecipeById(recipeId);
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return <RecipeDetailClientPage recipe={recipe} />;
}
