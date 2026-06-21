/**
 * OpenAI Batch retrieved_data JSON 검증 (camelCase SSOT)
 * @see recipe-ingestion.system-prompt.ts
 */
import {
  isRecipeIngestionParseConfidence,
  isRecipeNutritionPayload,
  meetsRecipeIngestionMinParseConfidence,
  RECIPE_INGESTION_COOK_TIME_MAX,
  RECIPE_INGESTION_COOK_TIME_MIN,
  RECIPE_INGESTION_DEFAULT_COOK_TIME_MINUTES,
  RECIPE_INGESTION_DEFAULT_DIFFICULTY,
  RECIPE_INGESTION_DIFFICULTY_MAX,
  RECIPE_INGESTION_DIFFICULTY_MIN,
  RECIPE_INGESTION_MIN_PARSE_CONFIDENCE,
  type RecipeIngestionParseConfidence,
  type RecipeNutritionPayload,
} from '@mealio/shared';

/** LLM 추론·레거시 payload → DB difficulty (1-3 정수, 범위 밖은 clamp) */
export function resolveRecipeIngestionDifficulty(
  difficulty: number | null | undefined,
): number {
  if (difficulty == null || !Number.isFinite(difficulty)) {
    return RECIPE_INGESTION_DEFAULT_DIFFICULTY;
  }
  return Math.min(
    RECIPE_INGESTION_DIFFICULTY_MAX,
    Math.max(RECIPE_INGESTION_DIFFICULTY_MIN, Math.round(difficulty)),
  );
}

/** LLM 추론·레거시 payload → DB cookTime (분, 정수, 범위 밖은 clamp) */
export function resolveRecipeIngestionCookTimeMinutes(
  cookingTimeMinutes: number | null | undefined,
): number {
  if (cookingTimeMinutes == null || !Number.isFinite(cookingTimeMinutes)) {
    return RECIPE_INGESTION_DEFAULT_COOK_TIME_MINUTES;
  }
  return Math.min(
    RECIPE_INGESTION_COOK_TIME_MAX,
    Math.max(RECIPE_INGESTION_COOK_TIME_MIN, Math.round(cookingTimeMinutes)),
  );
}

export interface ProposedCategoryPayload {
  key: string;
  name: string;
}

export type RetrievedNutritionPayload = RecipeNutritionPayload;

export interface RetrievedRecipeStepPayload {
  content: string;
  imageUrl?: string | null;
}

export interface RetrievedRecipePayload {
  title: string;
  description?: string | null;
  servings?: number | null;
  difficulty?: number | null;
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

export interface ValidatedRetrievedRecipePayload extends Omit<
  RetrievedRecipePayload,
  'steps' | 'difficulty' | 'cookingTimeMinutes'
> {
  steps: RetrievedRecipeStepPayload[];
  difficulty: number;
  cookingTimeMinutes: number;
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
  parseConfidence: RecipeIngestionParseConfidence;
  parseIssues?: string[];
}

export class RetrievedDataValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetrievedDataValidationError';
  }
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

function normalizeRecipeSteps(steps: unknown): RetrievedRecipeStepPayload[] {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new RetrievedDataValidationError(
      'recipe.steps must be a non-empty array',
    );
  }

  if (steps.every((s) => typeof s === 'string')) {
    return steps.map((content) => ({ content }));
  }

  if (!steps.every(isRetrievedRecipeStep)) {
    throw new RetrievedDataValidationError('Invalid recipe.steps payload');
  }

  return steps;
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

function isValidDifficulty(value: unknown): boolean {
  return value == null || (typeof value === 'number' && Number.isFinite(value));
}

function isValidCookTimeMinutes(value: unknown): boolean {
  return value == null || (typeof value === 'number' && Number.isFinite(value));
}

function isRetrievedRecipe(value: unknown): value is RetrievedRecipePayload {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const o = value as Record<string, unknown>;
  if (typeof o.title !== 'string' || o.title.trim().length === 0) {
    return false;
  }
  if (!isValidDifficulty(o.difficulty)) {
    return false;
  }
  if (!isValidCookTimeMinutes(o.cookingTimeMinutes)) {
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
  if (o.proposedCategory != null && !isProposedCategory(o.proposedCategory)) {
    return false;
  }
  if (o.nutrition != null && !isRecipeNutritionPayload(o.nutrition)) {
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
  if (o.proposedCategory != null && !isProposedCategory(o.proposedCategory)) {
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

  if (!isRecipeIngestionParseConfidence(raw.parseConfidence)) {
    throw new RetrievedDataValidationError(
      'parseConfidence must be high, medium, or low',
    );
  }

  if (
    !meetsRecipeIngestionMinParseConfidence(
      raw.parseConfidence,
      RECIPE_INGESTION_MIN_PARSE_CONFIDENCE,
    )
  ) {
    throw new RetrievedDataValidationError(
      `parseConfidence must be at least ${RECIPE_INGESTION_MIN_PARSE_CONFIDENCE}`,
    );
  }

  return {
    recipe: {
      ...raw.recipe,
      steps: normalizeRecipeSteps(raw.recipe.steps),
      difficulty: resolveRecipeIngestionDifficulty(raw.recipe.difficulty),
      cookingTimeMinutes: resolveRecipeIngestionCookTimeMinutes(
        raw.recipe.cookingTimeMinutes,
      ),
    },
    ingredients: raw.ingredients,
    parseConfidence: raw.parseConfidence,
    parseIssues: Array.isArray(raw.parseIssues)
      ? raw.parseIssues.filter((i): i is string => typeof i === 'string')
      : [],
  };
}
