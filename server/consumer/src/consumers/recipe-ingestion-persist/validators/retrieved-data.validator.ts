/**
 * OpenAI Batch retrieved_data JSON 검증 (camelCase SSOT)
 * @see recipe-ingestion.system-prompt.ts
 */

export interface ProposedCategoryPayload {
  key: string;
  name: string;
}

export interface RetrievedNutritionPayload {
  calories?: number | null;
  carbohydrates?: number | null;
  protein?: number | null;
  fat?: number | null;
  sodium?: number | null;
}

export interface RetrievedRecipeStepPayload {
  content: string;
  imageUrl?: string | null;
}

export interface RetrievedRecipePayload {
  title: string;
  description?: string | null;
  servings?: number | null;
  cookingTimeMinutes?: number | null;
  categoryId?: number | null;
  proposedCategory?: ProposedCategoryPayload | null;
  /** 레거시: 문자열 배열. 신규: { content, imageUrl? } 객체 배열 */
  steps: string[] | RetrievedRecipeStepPayload[];
  tips?: string | null;
  imageUrl?: string | null;
  nutrition?: RetrievedNutritionPayload | null;
  cookingMethod?: string | null;
  dishType?: string | null;
}

export interface ValidatedRetrievedRecipePayload
  extends Omit<RetrievedRecipePayload, 'steps'> {
  steps: RetrievedRecipeStepPayload[];
}

export interface RetrievedIngredientPayload {
  rawName: string;
  normalizedName: string;
  ingredientAlias: string;
  quantity?: string | null;
  unit?: string | null;
  categoryId?: number | null;
  proposedCategory?: ProposedCategoryPayload | null;
}

export interface RetrievedDataPayload {
  recipe: ValidatedRetrievedRecipePayload;
  ingredients: RetrievedIngredientPayload[];
  parseConfidence: 'high' | 'low';
  parseIssues?: string[];
}

export class RetrievedDataValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetrievedDataValidationError';
  }
}

function isNutritionNumber(value: unknown): boolean {
  return (
    value == null ||
    (typeof value === 'number' && Number.isFinite(value))
  );
}

function isRetrievedNutrition(
  value: unknown,
): value is RetrievedNutritionPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    isNutritionNumber(o.calories) &&
    isNutritionNumber(o.carbohydrates) &&
    isNutritionNumber(o.protein) &&
    isNutritionNumber(o.fat) &&
    isNutritionNumber(o.sodium)
  );
}

function isRetrievedRecipeStep(
  value: unknown,
): value is RetrievedRecipeStepPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const o = value as Record<string, unknown>;
  if (typeof o.content !== 'string' || o.content.trim().length === 0) {
    return false;
  }
  if (o.imageUrl != null && typeof o.imageUrl !== 'string') {
    return false;
  }
  return true;
}

function normalizeRecipeSteps(
  steps: unknown,
): RetrievedRecipeStepPayload[] {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new RetrievedDataValidationError('recipe.steps must be a non-empty array');
  }

  if (steps.every((s) => typeof s === 'string')) {
    return (steps as string[]).map((content) => ({ content }));
  }

  if (!steps.every(isRetrievedRecipeStep)) {
    throw new RetrievedDataValidationError('Invalid recipe.steps payload');
  }

  return steps as RetrievedRecipeStepPayload[];
}

function isProposedCategory(value: unknown): value is ProposedCategoryPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o.key === 'string' &&
    o.key.length > 0 &&
    typeof o.name === 'string' &&
    o.name.length > 0
  );
}

function isRetrievedRecipe(value: unknown): value is RetrievedRecipePayload {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const o = value as Record<string, unknown>;
  if (typeof o.title !== 'string' || o.title.trim().length === 0) {
    return false;
  }
  if (!Array.isArray(o.steps) || o.steps.length === 0) {
    return false;
  }
  const stepsValid =
    o.steps.every((s) => typeof s === 'string') ||
    o.steps.every(isRetrievedRecipeStep);
  if (!stepsValid) {
    return false;
  }
  if (
    o.proposedCategory != null &&
    !isProposedCategory(o.proposedCategory)
  ) {
    return false;
  }
  if (o.nutrition != null && !isRetrievedNutrition(o.nutrition)) {
    return false;
  }
  return true;
}

function isRetrievedIngredient(
  value: unknown,
): value is RetrievedIngredientPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const o = value as Record<string, unknown>;
  if (
    typeof o.rawName !== 'string' ||
    typeof o.normalizedName !== 'string' ||
    typeof o.ingredientAlias !== 'string'
  ) {
    return false;
  }
  if (
    o.proposedCategory != null &&
    !isProposedCategory(o.proposedCategory)
  ) {
    return false;
  }
  return true;
}

export function validateRetrievedData(
  raw: Record<string, unknown> | null | undefined,
): RetrievedDataPayload {
  if (!raw || typeof raw !== 'object') {
    throw new RetrievedDataValidationError('retrievedData is missing');
  }

  if (!isRetrievedRecipe(raw.recipe)) {
    throw new RetrievedDataValidationError('Invalid recipe payload');
  }

  if (!Array.isArray(raw.ingredients)) {
    throw new RetrievedDataValidationError('ingredients must be an array');
  }

  if (
    raw.ingredients.length === 0 ||
    !raw.ingredients.every(isRetrievedIngredient)
  ) {
    throw new RetrievedDataValidationError('Invalid ingredients payload');
  }

  if (raw.parseConfidence !== 'high' && raw.parseConfidence !== 'low') {
    throw new RetrievedDataValidationError('parseConfidence must be high or low');
  }

  const recipe = raw.recipe as RetrievedRecipePayload;

  return {
    recipe: {
      ...recipe,
      steps: normalizeRecipeSteps(recipe.steps),
    },
    ingredients: raw.ingredients,
    parseConfidence: raw.parseConfidence,
    parseIssues: Array.isArray(raw.parseIssues)
      ? raw.parseIssues.filter((i): i is string => typeof i === 'string')
      : [],
  };
}
