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
    expect(result.recipe.difficulty).toBe(2);
    expect(result.recipe.cookingTimeMinutes).toBe(30);
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

  it('should normalize difficulty from LLM output', () => {
    expect(
      validateRetrievedData({
        ...validPayload,
        recipe: { ...validPayload.recipe, difficulty: 3 },
      }).recipe.difficulty,
    ).toBe(3);

    expect(
      validateRetrievedData({
        ...validPayload,
        recipe: { ...validPayload.recipe, difficulty: 4 },
      }).recipe.difficulty,
    ).toBe(3);

    expect(
      validateRetrievedData({
        ...validPayload,
        recipe: { ...validPayload.recipe, difficulty: 2.4 },
      }).recipe.difficulty,
    ).toBe(2);

    expect(
      validateRetrievedData({
        ...validPayload,
        recipe: { ...validPayload.recipe, difficulty: 0 },
      }).recipe.difficulty,
    ).toBe(1);
  });

  it('should reject invalid difficulty type', () => {
    expect(() =>
      validateRetrievedData({
        ...validPayload,
        recipe: { ...validPayload.recipe, difficulty: 'hard' },
      }),
    ).toThrow(RetrievedDataValidationError);
  });

  it('should normalize cookTime from LLM output', () => {
    expect(
      validateRetrievedData({
        ...validPayload,
        recipe: { ...validPayload.recipe, cookingTimeMinutes: 45 },
      }).recipe.cookingTimeMinutes,
    ).toBe(45);

    expect(
      validateRetrievedData({
        ...validPayload,
        recipe: { ...validPayload.recipe, cookingTimeMinutes: undefined },
      }).recipe.cookingTimeMinutes,
    ).toBe(30);

    expect(
      validateRetrievedData({
        ...validPayload,
        recipe: { ...validPayload.recipe, cookingTimeMinutes: 4.2 },
      }).recipe.cookingTimeMinutes,
    ).toBe(5);

    expect(
      validateRetrievedData({
        ...validPayload,
        recipe: { ...validPayload.recipe, cookingTimeMinutes: 240 },
      }).recipe.cookingTimeMinutes,
    ).toBe(180);
  });

  it('should reject invalid cookTime type', () => {
    expect(() =>
      validateRetrievedData({
        ...validPayload,
        recipe: { ...validPayload.recipe, cookingTimeMinutes: '30분' },
      }),
    ).toThrow(RetrievedDataValidationError);
  });

  it('should reject missing recipe', () => {
    expect(() =>
      validateRetrievedData({ ...validPayload, recipe: null }),
    ).toThrow(RetrievedDataValidationError);
  });

  it('should reject invalid parseConfidence', () => {
    expect(() =>
      validateRetrievedData({ ...validPayload, parseConfidence: 'invalid' }),
    ).toThrow(RetrievedDataValidationError);
  });

  it('should accept medium parseConfidence', () => {
    const result = validateRetrievedData({
      ...validPayload,
      parseConfidence: 'medium',
    });
    expect(result.parseConfidence).toBe('medium');
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
