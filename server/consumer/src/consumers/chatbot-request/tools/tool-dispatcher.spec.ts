import { ToolDispatcher } from './tool-dispatcher';

describe('ToolDispatcher', () => {
  it('search_recipes 인자를 확장 스키마에 맞게 파싱해 전달한다', async () => {
    const searchRecipesHandler = {
      execute: jest.fn().mockResolvedValue([]),
    };
    const foodCategoriesHandler = {
      execute: jest.fn().mockResolvedValue({}),
    };
    const inventoryHandler = {
      execute: jest.fn().mockResolvedValue({}),
    };
    const finalizeRecipeSelectionHandler = {
      execute: jest.fn().mockReturnValue([]),
    };

    const dispatcher = new ToolDispatcher(
      searchRecipesHandler as never,
      foodCategoriesHandler as never,
      inventoryHandler as never,
      finalizeRecipeSelectionHandler as never,
    );

    await dispatcher.execute(
      'search_recipes',
      {
        keywords: ['저녁'],
        ingredientIds: [1, 2],
        mustHaveIngredients: ['닭가슴살'],
        avoidIngredientIds: [3],
        avoidIngredients: ['우유'],
        maxCookTime: 30,
        servings: 2,
        dietaryTags: ['고단백'],
        recipeCategoryIds: [4],
        ingredientCategoryIds: [7],
      },
      { userId: 11 },
    );

    expect(searchRecipesHandler.execute).toHaveBeenCalledWith(
      {
        keywords: ['저녁'],
        ingredientIds: [1, 2],
        mustHaveIngredients: ['닭가슴살'],
        avoidIngredientIds: [3],
        avoidIngredients: ['우유'],
        maxCookTime: 30,
        servings: 2,
        dietaryTags: ['고단백'],
        recipeCategoryIds: [4],
        ingredientCategoryIds: [7],
      },
      { userId: 11 },
    );
  });

  it('알 수 없는 함수명은 error payload를 반환한다', async () => {
    const dispatcher = new ToolDispatcher(
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
    );

    const result = await dispatcher.execute('unknown_tool', {}, { userId: 1 });
    expect(JSON.parse(result)).toEqual({
      error: 'Unknown function: unknown_tool',
    });
  });
});
