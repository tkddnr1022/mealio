import type {
  RecipeIngredientItem,
  RecipeInstructionStep,
  RecipeNutrition,
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
    (part): part is string =>
      typeof part === 'string' && part.trim().length > 0,
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

export function toNutritionValueLabel(
  value: number | null | undefined,
  unit: string,
): string | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }
  return `${value}${unit}`;
}

export type RecipeNutritionDisplayItem = Readonly<{
  label: string;
  value: string;
}>;

export function toRecipeNutritionDisplayItems(
  nutrition: RecipeNutrition | null | undefined,
): readonly RecipeNutritionDisplayItem[] {
  if (!nutrition) {
    return [];
  }
  const items: Array<RecipeNutritionDisplayItem | null> = [
    toNutritionValueLabel(nutrition.calories, 'kcal')
      ? {
          label: '열량',
          value: toNutritionValueLabel(nutrition.calories, 'kcal')!,
        }
      : null,
    toNutritionValueLabel(nutrition.carbohydrates, 'g')
      ? {
          label: '탄수화물',
          value: toNutritionValueLabel(nutrition.carbohydrates, 'g')!,
        }
      : null,
    toNutritionValueLabel(nutrition.protein, 'g')
      ? {
          label: '단백질',
          value: toNutritionValueLabel(nutrition.protein, 'g')!,
        }
      : null,
    toNutritionValueLabel(nutrition.fat, 'g')
      ? { label: '지방', value: toNutritionValueLabel(nutrition.fat, 'g')! }
      : null,
    toNutritionValueLabel(nutrition.sodium, 'mg')
      ? {
          label: '나트륨',
          value: toNutritionValueLabel(nutrition.sodium, 'mg')!,
        }
      : null,
  ];
  return items.filter(
    (item): item is RecipeNutritionDisplayItem => item != null,
  );
}
