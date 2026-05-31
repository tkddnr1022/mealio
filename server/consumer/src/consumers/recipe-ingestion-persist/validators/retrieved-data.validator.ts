/**
 * OpenAI Batch retrieved_data JSON 검증 (camelCase SSOT)
 * @see recipe-ingestion.system-prompt.ts
 */

export interface ProposedCategoryPayload {
  key: string;
  name: string;
}

export interface RetrievedRecipePayload {
  title: string;
  description?: string | null;
  servings?: number | null;
  cookingTimeMinutes?: number | null;
  categoryId?: number | null;
  proposedCategory?: ProposedCategoryPayload | null;
  steps: string[];
  tips?: string | null;
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
  recipe: RetrievedRecipePayload;
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
  if (!Array.isArray(o.steps) || o.steps.some((s) => typeof s !== 'string')) {
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

  return {
    recipe: raw.recipe,
    ingredients: raw.ingredients,
    parseConfidence: raw.parseConfidence,
    parseIssues: Array.isArray(raw.parseIssues)
      ? raw.parseIssues.filter((i): i is string => typeof i === 'string')
      : [],
  };
}
