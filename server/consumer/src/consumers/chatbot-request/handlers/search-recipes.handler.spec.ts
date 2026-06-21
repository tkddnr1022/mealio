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
        ingredient: { name: '닭가슴살', categoryId: 7 },
      },
      {
        ingredientId: 2,
        isOptional: false,
        ingredient: { name: '양상추', categoryId: 8 },
      },
    ],
    ...overrides,
  });

  const createHandler = (
    overrides: {
      openaiService?: Record<string, jest.Mock>;
      recipeEmbeddingRepository?: Record<string, jest.Mock>;
      recipeSearchQueryService?: Record<string, jest.Mock>;
      recipeSearchQueryExpansionService?: Record<string, jest.Mock>;
    } = {},
  ) => {
    const prismaService = {
      userRecipeRecommendation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    const openaiService = {
      createEmbeddings: jest.fn().mockResolvedValue([
        [0.1, 0.2],
        [0.2, 0.3],
      ]),
      ...overrides.openaiService,
    };
    const recipeEmbeddingRepository = {
      searchTopK: jest
        .fn()
        .mockResolvedValue([{ recipeId: 101, semanticScore: 0.8 }]),
      ...overrides.recipeEmbeddingRepository,
    };
    const recipeSearchQueryService = {
      fetchRecipesByIds: jest.fn().mockResolvedValue([createRecipe()]),
      ...overrides.recipeSearchQueryService,
    };
    const recipeSearchQueryExpansionService = {
      expandQueries: jest
        .fn()
        .mockResolvedValue(['base query', 'expanded query']),
      ...overrides.recipeSearchQueryExpansionService,
    };

    const handler = new SearchRecipesHandler(
      prismaService as never,
      openaiService as never,
      recipeEmbeddingRepository as never,
      recipeSearchQueryService as never,
      recipeSearchQueryExpansionService as never,
    );

    return {
      handler,
      prismaService,
      openaiService,
      recipeEmbeddingRepository,
      recipeSearchQueryService,
      recipeSearchQueryExpansionService,
    };
  };

  it('semantic 검색 후 hard constraint 조회를 수행한다', async () => {
    const {
      handler,
      recipeEmbeddingRepository,
      recipeSearchQueryService,
      recipeSearchQueryExpansionService,
      openaiService,
    } = createHandler();

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

    expect(recipeSearchQueryExpansionService.expandQueries).toHaveBeenCalled();
    expect(openaiService.createEmbeddings).toHaveBeenCalled();
    expect(recipeEmbeddingRepository.searchTopK).toHaveBeenCalledWith(
      expect.objectContaining({
        excludeIngredientIds: [99],
      }),
    );
    expect(recipeSearchQueryService.fetchRecipesByIds).toHaveBeenCalledWith(
      [101],
      {
        excludeIngredientIds: [99],
        excludeIngredientNames: ['우유'],
      },
    );
    expect(result[0]).toMatchObject({
      cookingMethod: '볶기',
      dishType: '샐러드',
      nutritionSummary: '280kcal, 단백질 25g, 나트륨 400mg',
      topInstructionSnippet: '1. 닭가슴살을 굽습니다.',
      softConstraintScore: expect.any(Number),
    });
  });

  it('query expansion이 원질의만 반환해도 semantic 검색을 계속한다', async () => {
    const { handler, openaiService, recipeEmbeddingRepository } =
      createHandler({
        openaiService: {
          createEmbeddings: jest.fn().mockResolvedValue([[0.1, 0.2]]),
        },
        recipeSearchQueryExpansionService: {
          expandQueries: jest
            .fn()
            .mockResolvedValue([
              'keywords: 고단백\nmust_have: \navoid: \ncook_time: \nservings: ',
            ]),
        },
      });

    await handler.execute({ keywords: ['고단백'] }, { userId: 10 });

    expect(openaiService.createEmbeddings).toHaveBeenCalledWith([
      'keywords: 고단백\nmust_have: \navoid: \ncook_time: \nservings: ',
    ]);
    expect(recipeEmbeddingRepository.searchTopK).toHaveBeenCalledTimes(1);
  });

  it('ANN 후보가 없으면 빈 배열을 반환한다', async () => {
    const { handler } = createHandler({
      recipeEmbeddingRepository: {
        searchTopK: jest.fn().mockResolvedValue([]),
      },
    });

    const result = await handler.execute(
      { keywords: ['간단'] },
      { userId: 10 },
    );

    expect(result).toEqual([]);
  });

  it('dishType·cookingMethod가 키워드와 맞으면 keywordScore가 올라간다', async () => {
    const { handler } = createHandler({
      recipeSearchQueryService: {
        fetchRecipesByIds: jest.fn().mockResolvedValue([
          createRecipe({
            title: '요리',
            description: '',
            cookingMethod: '찌기',
            dishType: '국',
          }),
        ]),
      },
    });

    const result = await handler.execute(
      { keywords: ['찌기', '국'] },
      { userId: 10 },
    );

    expect(result[0]?.keywordScore).toBe(1);
  });

  it('soft constraint가 충족되면 reasonSignals에 cook_time_match를 포함한다', async () => {
    const { handler } = createHandler();

    const result = await handler.execute(
      {
        keywords: ['저녁'],
        cookTime: { lte: 30 },
        servings: { gte: 2 },
        recipeCategoryIds: [3],
        ingredientCategoryIds: [7],
        mustHaveIngredients: ['닭가슴살'],
      },
      { userId: 10 },
    );

    expect(result[0]?.reasonSignals).toEqual(
      expect.arrayContaining([
        'semantic_match',
        'soft_constraint_match',
        'cook_time_match',
        'servings_match',
        'category_match',
      ]),
    );
    expect(result[0]?.softConstraintScore).toBeGreaterThan(0.5);
  });

  it('다중 질의 결과를 max score + coverage bonus로 병합한다', async () => {
    const { handler } = createHandler({
      recipeEmbeddingRepository: {
        searchTopK: jest
          .fn()
          .mockResolvedValueOnce([
            { recipeId: 101, semanticScore: 0.7 },
            { recipeId: 202, semanticScore: 0.5 },
          ])
          .mockResolvedValueOnce([
            { recipeId: 101, semanticScore: 0.6 },
            { recipeId: 303, semanticScore: 0.9 },
          ]),
      },
      recipeSearchQueryService: {
        fetchRecipesByIds: jest
          .fn()
          .mockResolvedValue([
            createRecipe({ id: 101 }),
            createRecipe({ id: 202, title: '두번째' }),
            createRecipe({ id: 303, title: '세번째' }),
          ]),
      },
    });

    const result = await handler.execute(
      { keywords: ['고단백'] },
      { userId: 10 },
    );

    expect(result[0]?.id).toBe(303);
    expect(result[1]?.id).toBe(101);
    expect(result[0]?.semanticScore).toBe(0.9);
    expect(result[1]?.semanticScore).toBeCloseTo(0.75, 2);
  });
});
