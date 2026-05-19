import { FinalizeRecipeSelectionHandler } from './FinalizeRecipeSelectionHandler';

describe('FinalizeRecipeSelectionHandler', () => {
  const handler = new FinalizeRecipeSelectionHandler();

  it('후보 목록 내 recipeId만 최종 선택으로 반환한다', () => {
    const candidates = [
      {
        id: 11,
        title: 'A',
        description: null,
        difficulty: 1,
        cookTime: 10,
        imageUrl: null,
        servings: 1,
        categoryId: 1,
        categoryName: '한식',
      },
      {
        id: 22,
        title: 'B',
        description: null,
        difficulty: 2,
        cookTime: 20,
        imageUrl: null,
        servings: 2,
        categoryId: 1,
        categoryName: '한식',
      },
    ];

    const result = handler.execute(
      { selectedRecipeIds: [22, 999, 11] },
      candidates,
    );

    expect(result.map((item) => item.id)).toEqual([22, 11]);
  });

  it('선택 ID가 없으면 빈 배열을 반환한다', () => {
    const result = handler.execute({ selectedRecipeIds: [] }, []);
    expect(result).toEqual([]);
  });
});
