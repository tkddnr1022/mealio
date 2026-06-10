export const RECIPE_NUTRITION_FIELD_KEYS = [
  'calories',
  'carbohydrates',
  'protein',
  'fat',
  'sodium',
] as const;

export type RecipeNutritionField = (typeof RECIPE_NUTRITION_FIELD_KEYS)[number];

/** 1인분 영양 정보 (`Recipe.nutrition` JSON, schema.md SSOT) */
export type RecipeNutrition = Readonly<{
  calories: number | null;
  carbohydrates: number | null;
  protein: number | null;
  fat: number | null;
  sodium: number | null;
}>;

export type RecipeNutritionPayload = Partial<
  Record<RecipeNutritionField, number | null | undefined>
>;

export type RecipeNutritionFormatLocale = 'ko' | 'en';

const NUTRITION_LABELS: Record<
  RecipeNutritionFormatLocale,
  Record<RecipeNutritionField, string>
> = {
  ko: {
    calories: '',
    carbohydrates: '탄수화물',
    protein: '단백질',
    fat: '지방',
    sodium: '나트륨',
  },
  en: {
    calories: 'calories',
    carbohydrates: 'carbohydrates',
    protein: 'protein',
    fat: 'fat',
    sodium: 'sodium',
  },
};

const NUTRITION_UNITS: Record<RecipeNutritionField, string> = {
  calories: 'kcal',
  carbohydrates: 'g',
  protein: 'g',
  fat: 'g',
  sodium: 'mg',
};

export function parseRecipeNutritionValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isNullableNutritionNumber(value: unknown): boolean {
  return value == null || (typeof value === 'number' && Number.isFinite(value));
}

export function isRecipeNutritionPayload(
  value: unknown,
): value is RecipeNutritionPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return RECIPE_NUTRITION_FIELD_KEYS.every((key) =>
    isNullableNutritionNumber(record[key]),
  );
}

export function parseRecipeNutrition(
  nutrition: unknown,
): RecipeNutrition | null {
  if (
    nutrition == null ||
    typeof nutrition !== 'object' ||
    Array.isArray(nutrition)
  ) {
    return null;
  }

  const record = nutrition as Record<string, unknown>;
  const parsed: RecipeNutrition = {
    calories: parseRecipeNutritionValue(record.calories),
    carbohydrates: parseRecipeNutritionValue(record.carbohydrates),
    protein: parseRecipeNutritionValue(record.protein),
    fat: parseRecipeNutritionValue(record.fat),
    sodium: parseRecipeNutritionValue(record.sodium),
  };
  const hasValue = RECIPE_NUTRITION_FIELD_KEYS.some(
    (key) => parsed[key] != null,
  );
  return hasValue ? parsed : null;
}

export function compactRecipeNutritionForJson(
  nutrition: RecipeNutritionPayload | null | undefined,
): RecipeNutritionPayload | null {
  if (!nutrition) {
    return null;
  }

  const payload: RecipeNutritionPayload = {};
  for (const key of RECIPE_NUTRITION_FIELD_KEYS) {
    const value = nutrition[key];
    if (value != null && Number.isFinite(value)) {
      payload[key] = value;
    }
  }

  return Object.keys(payload).length > 0 ? payload : null;
}

export function formatRecipeNutritionSummary(
  nutrition: unknown,
  options: { locale?: RecipeNutritionFormatLocale } = {},
): string | null {
  const parsed = parseRecipeNutrition(nutrition);
  if (!parsed) {
    return null;
  }

  const locale = options.locale ?? 'ko';
  const labels = NUTRITION_LABELS[locale];
  const parts: string[] = [];

  for (const key of RECIPE_NUTRITION_FIELD_KEYS) {
    const value = parsed[key];
    if (value == null) {
      continue;
    }

    const unit = NUTRITION_UNITS[key];
    if (key === 'calories') {
      parts.push(
        locale === 'en'
          ? `${labels.calories} ${value}${unit}`
          : `${value}${unit}`,
      );
      continue;
    }

    parts.push(`${labels[key]} ${value}${unit}`);
  }

  return parts.length > 0 ? parts.join(', ') : null;
}

/** 한국어 요약 문자열 (`formatRecipeNutritionSummary` locale=ko 단축) */
export function formatNutritionSummary(nutrition: unknown): string | null {
  return formatRecipeNutritionSummary(nutrition, { locale: 'ko' });
}
