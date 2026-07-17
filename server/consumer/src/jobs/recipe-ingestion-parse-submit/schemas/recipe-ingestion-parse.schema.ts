/**
 * OpenAI Responses API Structured Outputs (`text.format` json_schema)
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §5.2
 * @see prompts/recipe-ingestion.system-prompt.ts (필드 의미·추론 규칙)
 */
import { RECIPE_INGESTION_PARSE_CONFIDENCE_VALUES } from '@mealio/shared';

const nullableString = {
  type: ['string', 'null'],
} as const;

const nullableNumber = {
  type: ['number', 'null'],
} as const;

const proposedCategorySchema = {
  anyOf: [
    {
      type: 'object',
      properties: {
        key: { type: 'string' },
        name: { type: 'string' },
      },
      required: ['key', 'name'],
      additionalProperties: false,
    },
    { type: 'null' },
  ],
} as const;

const nutritionSchema = {
  anyOf: [
    {
      type: 'object',
      properties: {
        calories: nullableNumber,
        carbohydrates: nullableNumber,
        protein: nullableNumber,
        fat: nullableNumber,
        sodium: nullableNumber,
      },
      required: [
        'calories',
        'carbohydrates',
        'protein',
        'fat',
        'sodium',
      ],
      additionalProperties: false,
    },
    { type: 'null' },
  ],
} as const;

const recipeStepSchema = {
  type: 'object',
  properties: {
    content: { type: 'string' },
    imageUrl: nullableString,
  },
  required: ['content', 'imageUrl'],
  additionalProperties: false,
} as const;

const recipeSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 1 },
    description: nullableString,
    servings: { type: 'integer', minimum: 1 },
    difficulty: { type: 'integer', minimum: 1, maximum: 3 },
    cookingTimeMinutes: { type: 'integer', minimum: 1 },
    categoryId: nullableNumber,
    proposedCategory: proposedCategorySchema,
    imageUrl: nullableString,
    nutrition: nutritionSchema,
    cookingMethod: nullableString,
    dishType: nullableString,
    steps: {
      type: 'array',
      minItems: 1,
      items: recipeStepSchema,
    },
    tips: nullableString,
  },
  required: [
    'title',
    'description',
    'servings',
    'difficulty',
    'cookingTimeMinutes',
    'categoryId',
    'proposedCategory',
    'imageUrl',
    'nutrition',
    'cookingMethod',
    'dishType',
    'steps',
    'tips',
  ],
  additionalProperties: false,
} as const;

const ingredientSchema = {
  type: 'object',
  properties: {
    rawName: { type: 'string' },
    normalizedName: { type: 'string' },
    ingredientAlias: { type: 'string' },
    quantity: nullableString,
    unit: nullableString,
    categoryId: nullableNumber,
    proposedCategory: proposedCategorySchema,
  },
  required: [
    'rawName',
    'normalizedName',
    'ingredientAlias',
    'quantity',
    'unit',
    'categoryId',
    'proposedCategory',
  ],
  additionalProperties: false,
} as const;

/** Batch `/v1/responses` Structured Outputs용 JSON Schema (strict) */
export const RECIPE_INGESTION_PARSE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    recipe: recipeSchema,
    ingredients: {
      type: 'array',
      minItems: 1,
      items: ingredientSchema,
    },
    parseConfidence: {
      type: 'string',
      enum: [...RECIPE_INGESTION_PARSE_CONFIDENCE_VALUES],
    },
    parseIssues: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['recipe', 'ingredients', 'parseConfidence', 'parseIssues'],
  additionalProperties: false,
} as const;

export const RECIPE_INGESTION_PARSE_TEXT_FORMAT = {
  type: 'json_schema' as const,
  name: 'recipe_ingestion_parse',
  strict: true as const,
  schema: RECIPE_INGESTION_PARSE_JSON_SCHEMA,
};

export type RecipeIngestionParseTextFormat =
  typeof RECIPE_INGESTION_PARSE_TEXT_FORMAT;
