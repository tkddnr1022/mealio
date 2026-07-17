import { ConfigService } from '@nestjs/config';
import { RecipeSearchQueryExpansionService } from './recipe-search-query-expansion.service';

function createConfig(): ConfigService {
  return {
    getOrThrow: (key: string) => {
      if (key === 'OPENAI_QUERY_EXPANSION_MODEL') return 'gpt-expansion-test';
      throw new Error(`missing ${key}`);
    },
  } as unknown as ConfigService;
}

describe('RecipeSearchQueryExpansionService', () => {
  it('LLM이 확장 질의를 반환하면 원질의와 함께 dedup된 목록을 반환한다', async () => {
    const openaiService = {
      createResponse: jest.fn().mockResolvedValue({
        content: JSON.stringify({
          queries: ['고단백 닭가슴살 요리', '운동 후 단백질 식단'],
        }),
      }),
    };
    const service = new RecipeSearchQueryExpansionService(
      openaiService as never,
      createConfig(),
    );

    const result = await service.expandQueries({
      baseQueryText: 'keywords: 고단백',
      mustHaveIngredients: ['닭가슴살'],
      avoidIngredients: ['우유'],
    });

    expect(result).toEqual([
      'keywords: 고단백',
      '고단백 닭가슴살 요리',
      '운동 후 단백질 식단',
    ]);
    expect(openaiService.createResponse).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        model: 'gpt-expansion-test',
        responseFormat: expect.objectContaining({
          type: 'json_schema',
          name: 'recipe_search_query_expansion',
          strict: true,
        }),
      }),
    );
  });

  it('LLM 호출 실패 시 원질의만 반환한다', async () => {
    const openaiService = {
      createResponse: jest.fn().mockRejectedValue(new Error('timeout')),
    };
    const service = new RecipeSearchQueryExpansionService(
      openaiService as never,
      createConfig(),
    );

    const result = await service.expandQueries({
      baseQueryText: 'keywords: 간단 요리',
    });

    expect(result).toEqual(['keywords: 간단 요리']);
  });

  it('빈 base query는 빈 배열을 반환한다', async () => {
    const openaiService = {
      createResponse: jest.fn(),
    };
    const service = new RecipeSearchQueryExpansionService(
      openaiService as never,
      createConfig(),
    );

    const result = await service.expandQueries({
      baseQueryText: '   ',
    });

    expect(result).toEqual([]);
    expect(openaiService.createResponse).not.toHaveBeenCalled();
  });
});
