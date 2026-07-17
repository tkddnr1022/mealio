import { ConfigService } from '@nestjs/config';
import { OpenAIService } from './openai.service';

const mockResponsesCreate = jest.fn();
const mockEmbeddingsCreate = jest.fn();

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    responses: { create: mockResponsesCreate },
    embeddings: { create: mockEmbeddingsCreate },
  }));
});

describe('OpenAIService', () => {
  let service: OpenAIService;

  beforeEach(() => {
    jest.clearAllMocks();
    const config = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'OPENAI_API_KEY') return 'test-key';
        if (key === 'OPENAI_CHAT_MODEL') return 'gpt-test';
        if (key === 'OPENAI_EMBEDDING_MODEL') return 'text-embedding-test';
        throw new Error(`missing ${key}`);
      }),
    } as unknown as ConfigService;

    service = new OpenAIService(config);
  });

  describe('createResponse', () => {
    it('usage·text.format·finishReason을 Responses 기준으로 매핑한다', async () => {
      mockResponsesCreate.mockResolvedValue({
        id: 'resp_1',
        output_text: '{"queries":["a"]}',
        status: 'completed',
        incomplete_details: null,
        usage: {
          input_tokens: 10,
          output_tokens: 5,
          total_tokens: 15,
        },
      });

      const jsonSchemaFormat = {
        type: 'json_schema' as const,
        name: 'recipe_search_query_expansion',
        strict: true as const,
        schema: {
          type: 'object',
          properties: { queries: { type: 'array', items: { type: 'string' } } },
          required: ['queries'],
          additionalProperties: false,
        },
      };

      const result = await service.createResponse(
        [{ role: 'user', content: 'hello' }],
        {
          instructions: 'sys',
          maxOutputTokens: 100,
          responseFormat: jsonSchemaFormat,
        },
      );

      expect(mockResponsesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-test',
          input: [{ role: 'user', content: 'hello' }],
          instructions: 'sys',
          max_output_tokens: 100,
          text: { format: jsonSchemaFormat },
          store: true,
        }),
      );
      expect(result).toEqual({
        content: '{"queries":["a"]}',
        finishReason: 'completed',
        responseId: 'resp_1',
        usage: {
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
        },
      });
    });

    it('incomplete + max_output_tokens이면 finishReason을 length로 매핑한다', async () => {
      mockResponsesCreate.mockResolvedValue({
        id: 'resp_2',
        output_text: 'partial',
        status: 'incomplete',
        incomplete_details: { reason: 'max_output_tokens' },
        usage: undefined,
      });

      const result = await service.createResponse('hi');
      expect(result.finishReason).toBe('length');
      expect(result.usage).toBeUndefined();
    });
  });

  describe('createResponseStream', () => {
    it('stream·store·previous_response_id·tools를 전달한다', async () => {
      const fakeStream = Symbol('stream');
      mockResponsesCreate.mockResolvedValue(fakeStream);

      const tools = [
        {
          type: 'function' as const,
          name: 'get_user_inventory',
          parameters: { type: 'object', properties: {} },
          strict: null,
        },
      ];

      const result = await service.createResponseStream(
        [{ role: 'user', content: 'msg' }],
        {
          instructions: 'sys',
          tools,
          previousResponseId: 'resp_prev',
        },
      );

      expect(result).toBe(fakeStream);
      expect(mockResponsesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-test',
          stream: true,
          store: true,
          instructions: 'sys',
          tools,
          tool_choice: 'auto',
          previous_response_id: 'resp_prev',
        }),
      );
    });
  });
});
