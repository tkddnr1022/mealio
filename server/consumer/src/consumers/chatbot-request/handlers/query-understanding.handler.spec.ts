import { Test } from '@nestjs/testing';
import { OpenAIService } from 'src/integrations/openai/openai.service';
import { QueryUnderstandingHandler } from './QueryUnderstandingHandler';

describe('QueryUnderstandingHandler', () => {
  it('모델 JSON 응답을 구조화 intent로 변환한다', async () => {
    const openaiService = {
      createChatCompletion: jest.fn().mockResolvedValue({
        content: JSON.stringify({
          keywords: ['저녁', '간단'],
          mustHaveIngredients: ['닭가슴살'],
          avoidIngredients: ['우유'],
          maxCookTime: 20,
          servings: 2,
          dietaryTags: ['고단백'],
          intentType: 'recommend',
        }),
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        QueryUnderstandingHandler,
        { provide: OpenAIService, useValue: openaiService },
      ],
    }).compile();

    const handler = module.get(QueryUnderstandingHandler);
    const result = await handler.execute('20분 안에 저녁 추천해줘');

    expect(result.intentType).toBe('recommend');
    expect(result.maxCookTime).toBe(20);
    expect(result.keywords).toEqual(['저녁', '간단']);
  });

  it('파싱 실패 시 빈 intent로 fallback한다', async () => {
    const openaiService = {
      createChatCompletion: jest.fn().mockResolvedValue({
        content: '{invalid json',
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        QueryUnderstandingHandler,
        { provide: OpenAIService, useValue: openaiService },
      ],
    }).compile();

    const handler = module.get(QueryUnderstandingHandler);
    const result = await handler.execute('아무거나');

    expect(result.intentType).toBe('other');
    expect(result.keywords).toEqual([]);
  });
});
