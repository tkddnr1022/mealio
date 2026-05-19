import { SearchRecipesHandler } from './SearchRecipesHandler';

describe('SearchRecipesHandler', () => {
  const createRecipe = () => ({
    id: 101,
    title: '닭가슴살 샐러드',
    description: '간단한 저녁',
    difficulty: 1,
    cookTime: 15,
    imageUrl: null,
    servings: 2,
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

    await handler.execute(
      {
        keywords: ['저녁'],
        mustHaveIngredients: ['닭가슴살'],
        avoidIngredients: ['우유'],
        maxCookTime: 30,
        servings: 2,
        dietaryTags: ['고단백'],
        ingredientIds: [1],
        avoidIngredientIds: [99],
        recipeCategoryIds: [3],
        ingredientCategoryIds: [7],
      },
      { userId: 10 },
    );

    expect(recipeSearchQueryService.searchRecipes).toHaveBeenCalledWith({
      maxCookTime: 30,
      servings: 2,
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
      expect.stringContaining('dietary_tags: 고단백'),
    );
    expect(recipeEmbeddingService.createQueryEmbedding).toHaveBeenCalledWith(
      expect.stringContaining('servings: 2'),
    );
  });

  it('maxCookTime이 유효하지 않으면 시간 필터 없이 조회한다', async () => {
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
        maxCookTime: -5,
      },
      { userId: 10 },
    );

    expect(recipeSearchQueryService.searchRecipes).toHaveBeenCalledWith(
      expect.objectContaining({
        maxCookTime: undefined,
      }),
    );
  });
});
