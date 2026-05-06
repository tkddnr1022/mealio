import type {
  RecipeIngredientItem,
  RecipeInstructionStep,
  RecipeSummary,
} from '@/lib/types/recipe';
import { formatCookingTime } from '@/lib/utils/date';
import { buildBlurDataUrl } from '@/lib/utils/image';

const FALLBACK_RECIPE_IMAGE = buildBlurDataUrl({ width: 16, height: 16 });

export function toRecipeDetailHref(recipeId: number | string): string {
  return `/recipe/${encodeURIComponent(String(recipeId))}`;
}

export function toRecipeImageUrl(imageUrl: RecipeSummary['imageUrl']): string {
  const trimmed = imageUrl?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : FALLBACK_RECIPE_IMAGE;
}

export function toRecipeCookingTimeLabel(cookTimeMinutes: number): string {
  return formatCookingTime(cookTimeMinutes);
}

export function toRecipeDifficultyLabel(difficulty: number): string {
  if (difficulty <= 2) return '쉬움';
  if (difficulty === 3) return '보통';
  return '어려움';
}

export function toRecipeServingsLabel(servings: number): string {
  return `${servings}인분`;
}

export function joinRecipeMetaLine(
  ...parts: ReadonlyArray<string | null | undefined>
): string | null {
  const filtered = parts.filter(
    (part): part is string => typeof part === 'string' && part.trim().length > 0,
  );
  return filtered.length > 0 ? filtered.join(' · ') : null;
}

export function toIngredientQuantityLabel(
  ingredient: Pick<RecipeIngredientItem, 'amount' | 'unit'>,
): string {
  return `${ingredient.amount ?? ''}${ingredient.unit ?? ''}`.trim();
}

export function toRecipeStepLabel(
  step: Pick<RecipeInstructionStep, 'step'>['step'],
): string {
  return String(step);
}
