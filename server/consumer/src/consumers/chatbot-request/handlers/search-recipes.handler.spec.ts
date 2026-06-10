import { SearchRecipesHandler } from './SearchRecipesHandler';

describe('SearchRecipesHandler', () => {
  const createRecipe = (overrides: Record<string, unknown> = {}) => ({
    id: 101,
    title: '닭가슴살 샐러드',
    description: '간단한 저녁',
    difficulty: 1,
    cookTime: 15,
    imageUrl: null,
    servings: 2,
    cookingMethod: '볶기',
    dishType: '샐러드',
    cookingTip: '소금은 조금만 넣으세요',
    nutrition: { protein: 25, sodium: 400, calories: 280 },
    instructions: [{ step: 1, content: '닭가슴살을 굽습니다.' }],
    categoryId: 3,
    categoryMeta: { id: 3, name: '샐러드' },
    recipeIngredients: [
      {
        ingredientId: 1,
        isOptional: false,
        ingredient: { name: '닭가슴살' },
      },
      {
        ingredientId: 2,
        isOptional: false,
        ingredient: { name: '양상추' },
      },
    ],
    ...overrides,
  });

  it('확장된 search_recipes payload 필드를 쿼리와 시맨틱 컨텍스트에 반영한다', async () => {
    const prismaService = {
      userRecipeRecommendation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const recipeEmbeddingService = {
      ensureEmbeddingsForRecipeIds: jest.fn().mockResolvedValue(undefined),
      createQueryEmbedding: jest.fn().mockResolvedValue([0.1, 0.2]),
    };
    const recipeEmbeddingRepository = {
      searchByRecipeIds: jest
        .fn()
        .mockResolvedValue([{ recipeId: 101, semanticScore: 0.8 }]),
    };
    const recipeSearchQueryService = {
      searchRecipes: jest.fn().mockResolvedValue([createRecipe()]),
    };

    const handler = new SearchRecipesHandler(
      prismaService as never,
      recipeEmbeddingService as never,
      recipeEmbeddingRepository as never,
      recipeSearchQueryService as never,
    );

    const result = await handler.execute(
      {
        keywords: ['저녁'],
        mustHaveIngredients: ['닭가슴살'],
        avoidIngredients: ['우유'],
        cookTime: { lte: 30 },
        servings: { gte: 2 },
        ingredientIds: [1],
        avoidIngredientIds: [99],
        recipeCategoryIds: [3],
        ingredientCategoryIds: [7],
      },
      { userId: 10 },
    );

    expect(recipeSearchQueryService.searchRecipes).toHaveBeenCalledWith({
      cookTime: { lte: 30 },
      servings: { gte: 2 },
      recipeCategoryIds: [3],
      ingredientCategoryIds: [7],
      includeIngredientIds: [1],
      includeIngredientNames: ['닭가슴살'],
      excludeIngredientIds: [99],
      excludeIngredientNames: ['우유'],
    });
    expect(recipeEmbeddingService.createQueryEmbedding).toHaveBeenCalledWith(
      expect.stringContaining('must_have: 닭가슴살'),
    );
    expect(recipeEmbeddingService.createQueryEmbedding).toHaveBeenCalledWith(
      expect.stringContaining('cook_time: max 30'),
    );
    expect(recipeEmbeddingService.createQueryEmbedding).toHaveBeenCalledWith(
      expect.stringContaining('servings: min 2'),
    );
    expect(result[0]).toMatchObject({
      cookingMethod: '볶기',
      dishType: '샐러드',
      nutritionSummary: '280kcal, 단백질 25g, 나트륨 400mg',
      topInstructionSnippet: '1. 닭가슴살을 굽습니다.',
    });
  });

  it('cookTime·servings 범위 필드를 쿼리 서비스에 전달한다', async () => {
    const prismaService = {
      userRecipeRecommendation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const recipeEmbeddingService = {
      ensureEmbeddingsForRecipeIds: jest.fn().mockResolvedValue(undefined),
      createQueryEmbedding: jest.fn().mockResolvedValue([]),
    };
    const recipeEmbeddingRepository = {
      searchByRecipeIds: jest.fn().mockResolvedValue([]),
    };
    const recipeSearchQueryService = {
      searchRecipes: jest.fn().mockResolvedValue([createRecipe()]),
    };

    const handler = new SearchRecipesHandler(
      prismaService as never,
      recipeEmbeddingService as never,
      recipeEmbeddingRepository as never,
      recipeSearchQueryService as never,
    );

    await handler.execute(
      {
        cookTime: { gte: 10, lte: 30 },
        servings: { gte: 2, lte: 4 },
      },
      { userId: 10 },
    );

    expect(recipeSearchQueryService.searchRecipes).toHaveBeenCalledWith(
      expect.objectContaining({
        cookTime: { gte: 10, lte: 30 },
        servings: { gte: 2, lte: 4 },
      }),
    );
    expect(recipeEmbeddingService.createQueryEmbedding).toHaveBeenCalledWith(
      expect.stringContaining('cook_time: min 10, max 30'),
    );
    expect(recipeEmbeddingService.createQueryEmbedding).toHaveBeenCalledWith(
      expect.stringContaining('servings: min 2, max 4'),
    );
  });

  it('dishType·cookingMethod가 키워드와 맞으면 keywordScore가 올라간다', async () => {
    const prismaService = {
      userRecipeRecommendation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const recipeEmbeddingService = {
      ensureEmbeddingsForRecipeIds: jest.fn().mockResolvedValue(undefined),
      createQueryEmbedding: jest.fn().mockResolvedValue([]),
    };
    const recipeEmbeddingRepository = {
      searchByRecipeIds: jest.fn().mockResolvedValue([]),
    };
    const recipeSearchQueryService = {
      searchRecipes: jest.fn().mockResolvedValue([
        createRecipe({
          title: '요리',
          description: '',
          cookingMethod: '찌기',
          dishType: '국',
        }),
      ]),
    };

    const handler = new SearchRecipesHandler(
      prismaService as never,
      recipeEmbeddingService as never,
      recipeEmbeddingRepository as never,
      recipeSearchQueryService as never,
    );

    const result = await handler.execute(
      { keywords: ['찌기', '국'] },
      { userId: 10 },
    );

    expect(result[0]?.keywordScore).toBe(1);
  });

  it('유효하지 않은 cookTime 범위는 필터 없이 조회한다', async () => {
    const prismaService = {
      userRecipeRecommendation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const recipeEmbeddingService = {
      ensureEmbeddingsForRecipeIds: jest.fn().mockResolvedValue(undefined),
      createQueryEmbedding: jest.fn().mockResolvedValue([]),
    };
    const recipeEmbeddingRepository = {
      searchByRecipeIds: jest.fn().mockResolvedValue([]),
    };
    const recipeSearchQueryService = {
      searchRecipes: jest.fn().mockResolvedValue([createRecipe()]),
    };

    const handler = new SearchRecipesHandler(
      prismaService as never,
      recipeEmbeddingService as never,
      recipeEmbeddingRepository as never,
      recipeSearchQueryService as never,
    );

    await handler.execute(
      {
        keywords: ['간단'],
        cookTime: { lte: -5 },
      },
      { userId: 10 },
    );

    expect(recipeSearchQueryService.searchRecipes).toHaveBeenCalledWith(
      expect.objectContaining({
        cookTime: { lte: -5 },
      }),
    );
  });
});
