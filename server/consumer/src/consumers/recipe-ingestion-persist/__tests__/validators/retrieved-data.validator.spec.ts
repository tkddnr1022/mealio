import {
  RetrievedDataValidationError,
  validateRetrievedData,
} from '../../validators/retrieved-data.validator';

const validPayload = {
  recipe: {
    title: '김치찌개',
    steps: ['재료를 준비해요.', '끓여요.'],
    cookingTimeMinutes: 30,
    servings: 2,
    categoryId: 1,
  },
  ingredients: [
    {
      rawName: '김치 200g',
      normalizedName: '김치',
      ingredientAlias: '김치',
      quantity: '200',
      unit: 'g',
      categoryId: 1,
    },
  ],
  parseConfidence: 'high' as const,
  parseIssues: [],
};

describe('validateRetrievedData', () => {
  it('should accept valid payload', () => {
    const result = validateRetrievedData(validPayload);
    expect(result.recipe.title).toBe('김치찌개');
    expect(result.parseConfidence).toBe('high');
  });

  it('should reject missing recipe', () => {
    expect(() =>
      validateRetrievedData({ ...validPayload, recipe: null }),
    ).toThrow(RetrievedDataValidationError);
  });

  it('should reject invalid parseConfidence', () => {
    expect(() =>
      validateRetrievedData({ ...validPayload, parseConfidence: 'medium' }),
    ).toThrow(RetrievedDataValidationError);
  });

  it('should reject empty ingredients', () => {
    expect(() =>
      validateRetrievedData({ ...validPayload, ingredients: [] }),
    ).toThrow(RetrievedDataValidationError);
  });
});
