import { IngredientSemanticResolverService } from './ingredient-semantic-resolver.service';

describe('IngredientSemanticResolverService', () => {
  const createService = (
    overrides: {
      ingredientRepository?: Record<string, jest.Mock>;
      ingredientEmbeddingRepository?: Record<string, jest.Mock>;
      openaiService?: Record<string, jest.Mock>;
    } = {},
  ) => {
    const prismaService = {};
    const openaiService = {
      createEmbeddings: jest.fn().mockResolvedValue([[0.1, 0.2]]),
      ...overrides.openaiService,
    };
    const ingredientRepository = {
      findByName: jest.fn().mockResolvedValue(null),
      findManyNamesByIds: jest
        .fn()
        .mockResolvedValue([{ id: 5, name: '닭 가슴살' }]),
      ...overrides.ingredientRepository,
    };
    const ingredientEmbeddingRepository = {
      searchTopK: jest
        .fn()
        .mockResolvedValue([{ ingredientId: 5, score: 0.95 }]),
      ...overrides.ingredientEmbeddingRepository,
    };

    return {
      service: new IngredientSemanticResolverService(
        prismaService as never,
        openaiService as never,
        ingredientRepository as never,
        ingredientEmbeddingRepository as never,
      ),
      openaiService,
      ingredientRepository,
      ingredientEmbeddingRepository,
    };
  };

  it('exact name match 시 벡터 검색을 생략한다', async () => {
    const { service, openaiService, ingredientEmbeddingRepository } =
      createService({
        ingredientRepository: {
          findByName: jest.fn().mockResolvedValue({ id: 1, name: '닭가슴살' }),
        },
      });

    const result = await service.resolveNames(['닭가슴살']);

    expect(result).toEqual([
      {
        inputName: '닭가슴살',
        ingredientId: 1,
        canonicalName: '닭가슴살',
        score: 1,
        matchMethod: 'exact',
      },
    ]);
    expect(openaiService.createEmbeddings).not.toHaveBeenCalled();
    expect(ingredientEmbeddingRepository.searchTopK).not.toHaveBeenCalled();
  });

  it('exact match 실패 시 IngredientEmbedding으로 해상한다', async () => {
    const {
      service,
      openaiService,
      ingredientEmbeddingRepository,
      ingredientRepository,
    } = createService();

    const result = await service.resolveNames(['닭가슴']);

    expect(openaiService.createEmbeddings).toHaveBeenCalledWith(['닭가슴']);
    expect(ingredientEmbeddingRepository.searchTopK).toHaveBeenCalled();
    expect(ingredientRepository.findManyNamesByIds).toHaveBeenCalledWith([5]);
    expect(result).toEqual([
      {
        inputName: '닭가슴',
        ingredientId: 5,
        canonicalName: '닭 가슴살',
        score: 0.95,
        matchMethod: 'vector',
      },
    ]);
  });

  it('빈 입력은 빈 배열을 반환한다', async () => {
    const { service } = createService();

    await expect(service.resolveNames([])).resolves.toEqual([]);
    await expect(service.resolveNames(['', '  '])).resolves.toEqual([]);
  });
});
