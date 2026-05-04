import type { RecipeGridItem } from '@/components/recipe/lists/RecipeGrid';
import type { RecipeSummary } from '@/lib/types/recipe';
import { buildBlurDataUrl } from '@/lib/utils/image';

const FALLBACK_RECIPE_IMAGE = buildBlurDataUrl({ width: 16, height: 16 });

function difficultyLabel(level: number): string {
  if (level <= 2) return '쉬움';
  if (level === 3) return '보통';
  return '어려움';
}

/** API {@link RecipeSummary}를 그리드·슬라이더용 {@link RecipeGridItem}으로 변환한다. */
export function mapRecipeSummaryToGridItem(
  summary: RecipeSummary,
): RecipeGridItem {
  const imageUrl = summary.imageUrl?.trim();
  return {
    recipeId: String(summary.id),
    imageUrl: imageUrl && imageUrl.length > 0 ? imageUrl : FALLBACK_RECIPE_IMAGE,
    imageAlt: summary.title,
    title: summary.title,
    cookingTimeMinutes: summary.cookTime,
    difficulty: difficultyLabel(summary.difficulty),
    servings: `${summary.servings}인분`,
  };
}
