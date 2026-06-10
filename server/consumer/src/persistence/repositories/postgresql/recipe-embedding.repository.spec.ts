import { RecipeEmbeddingRepository } from './recipe-embedding.repository';

describe('RecipeEmbeddingRepository', () => {
  it('searchTopK는 published 조인과 limit을 포함한 SQL을 실행한다', async () => {
    const queryRawUnsafe = jest
      .fn()
      .mockResolvedValue([{ recipeId: 1, semanticScore: 0.9 }]);
    const prismaService = {
      $queryRawUnsafe: queryRawUnsafe,
    };
    const repository = new RecipeEmbeddingRepository(prismaService as never);

    const result = await repository.searchTopK({
      queryEmbedding: [0.1, 0.2],
      limit: 50,
    });

    expect(result).toEqual([{ recipeId: 1, semanticScore: 0.9 }]);
    expect(queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('INNER JOIN "Recipe" r'),
      '[0.1,0.2]',
      50,
    );
  });

  it('searchTopK는 기피 재료 ID가 있으면 제외 서브쿼리를 포함한다', async () => {
    const queryRawUnsafe = jest.fn().mockResolvedValue([]);
    const prismaService = {
      $queryRawUnsafe: queryRawUnsafe,
    };
    const repository = new RecipeEmbeddingRepository(prismaService as never);

    await repository.searchTopK({
      queryEmbedding: [0.3, 0.4],
      limit: 20,
      excludeIngredientIds: [9, 9, -1],
    });

    expect(queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('ingredient_id = ANY($2::int[])'),
      '[0.3,0.4]',
      [9],
      20,
    );
  });

  it('빈 embedding 또는 limit이면 검색하지 않는다', async () => {
    const queryRawUnsafe = jest.fn();
    const prismaService = {
      $queryRawUnsafe: queryRawUnsafe,
    };
    const repository = new RecipeEmbeddingRepository(prismaService as never);

    await expect(
      repository.searchTopK({
        queryEmbedding: [],
        limit: 50,
      }),
    ).resolves.toEqual([]);
    await expect(
      repository.searchTopK({
        queryEmbedding: [0.1],
        limit: 0,
      }),
    ).resolves.toEqual([]);
    expect(queryRawUnsafe).not.toHaveBeenCalled();
  });
});
