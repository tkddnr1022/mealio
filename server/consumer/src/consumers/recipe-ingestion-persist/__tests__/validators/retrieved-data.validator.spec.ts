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
    expect(result.recipe.steps).toEqual([
      { content: '재료를 준비해요.' },
      { content: '끓여요.' },
    ]);
  });

  it('should accept extended recipe metadata and object steps', () => {
    const result = validateRetrievedData({
      ...validPayload,
      recipe: {
        title: '된장찌개',
        imageUrl: 'http://example.com/thumb.png',
        nutrition: {
          calories: 300,
          carbohydrates: 10,
          protein: 15,
          fat: 8,
          sodium: 700,
        },
        cookingMethod: '끓이기',
        dishType: '국/탕',
        steps: [
          { content: '물을 넣어요.', imageUrl: 'http://example.com/s1.png' },
          { content: '끓여요.' },
        ],
      },
    });

    expect(result.recipe.imageUrl).toBe('http://example.com/thumb.png');
    expect(result.recipe.nutrition?.calories).toBe(300);
    expect(result.recipe.steps[0]?.imageUrl).toBe('http://example.com/s1.png');
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

  it('should reject invalid nutrition payload', () => {
    expect(() =>
      validateRetrievedData({
        ...validPayload,
        recipe: {
          ...validPayload.recipe,
          nutrition: { calories: 'not-a-number' },
        },
      }),
    ).toThrow(RetrievedDataValidationError);
  });

  it('should reject mixed step formats', () => {
    expect(() =>
      validateRetrievedData({
        ...validPayload,
        recipe: {
          ...validPayload.recipe,
          steps: ['텍스트', { content: '객체' }],
        },
      }),
    ).toThrow(RetrievedDataValidationError);
  });
});
