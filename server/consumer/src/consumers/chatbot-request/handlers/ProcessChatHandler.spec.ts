import { Test, TestingModule } from '@nestjs/testing';
import {
  RedisService,
  CHATBOT_STREAM_EVENT_TYPES,
  CHATBOT_TOOL_CALL_STATUS,
} from '@mealio/shared';
import { OpenAIService } from 'src/integrations/openai/openai.service';
import { ChatbotConversationRepository } from 'src/persistence/repositories/mongodb/chatbot-conversation.repository';
import { ToolDispatcher } from '../tools/tool-dispatcher';
import { ChatbotCreditService } from '../services/chatbot-credit.service';
import { ProcessChatHandler } from './ProcessChatHandler';
import { CHATBOT_SYSTEM_INSTRUCTIONS } from '../context/conversation.manager';

async function* eventsOf(
  events: Array<Record<string, unknown>>,
): AsyncGenerator<Record<string, unknown>> {
  for (const event of events) {
    yield event;
  }
}

describe('ProcessChatHandler', () => {
  let handler: ProcessChatHandler;
  let openai: jest.Mocked<Pick<OpenAIService, 'createResponseStream'>>;
  let redisPublish: jest.Mock;
  let conversations: jest.Mocked<
    Pick<
      ChatbotConversationRepository,
      'getLastResponseId' | 'saveLastResponseId'
    >
  >;
  let toolDispatcher: jest.Mocked<Pick<ToolDispatcher, 'execute'>>;
  let creditService: jest.Mocked<
    Pick<ChatbotCreditService, 'debitForCompletedChatbotTurn'>
  >;

  beforeEach(async () => {
    openai = { createResponseStream: jest.fn() };
    redisPublish = jest.fn();
    conversations = {
      getLastResponseId: jest.fn().mockResolvedValue(undefined),
      saveLastResponseId: jest.fn().mockResolvedValue(undefined),
    };
    toolDispatcher = {
      execute: jest.fn().mockResolvedValue('{"ok":true}'),
    };
    creditService = {
      debitForCompletedChatbotTurn: jest.fn().mockResolvedValue({
        isCreditDepleted: false,
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessChatHandler,
        { provide: OpenAIService, useValue: openai },
        {
          provide: RedisService,
          useValue: {
            getClient: () => ({ publish: redisPublish }),
          },
        },
        { provide: ToolDispatcher, useValue: toolDispatcher },
        { provide: ChatbotConversationRepository, useValue: conversations },
        { provide: ChatbotCreditService, useValue: creditService },
      ],
    }).compile();

    handler = module.get(ProcessChatHandler);
  });

  it('단순 텍스트 응답을 스트리밍하고 lastResponseId를 저장한다', async () => {
    openai.createResponseStream.mockResolvedValue(
      eventsOf([
        { type: 'response.output_text.delta', delta: '안녕' },
        { type: 'response.output_text.delta', delta: '하세요' },
        {
          type: 'response.completed',
          response: {
            id: 'resp_text',
            model: 'gpt-test',
            output: [],
            usage: {
              input_tokens: 8,
              output_tokens: 2,
              total_tokens: 10,
            },
          },
        },
      ]) as never,
    );

    const result = await handler.execute({
      userId: 1,
      message: '안녕하세요',
      conversationId: 'conv_1',
      streamChannelId: 'ch_1',
    });

    expect(result).toMatchObject({
      fullContent: '안녕하세요',
      usage: {
        promptTokens: 8,
        completionTokens: 2,
        totalTokens: 10,
      },
      model: 'gpt-test',
    });
    expect(openai.createResponseStream).toHaveBeenCalledWith(
      [{ role: 'user', content: '안녕하세요' }],
      expect.objectContaining({
        instructions: CHATBOT_SYSTEM_INSTRUCTIONS,
        previousResponseId: undefined,
      }),
    );
    expect(conversations.saveLastResponseId).toHaveBeenCalledWith(
      1,
      'conv_1',
      'resp_text',
    );
    expect(redisPublish).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(CHATBOT_STREAM_EVENT_TYPES.CHUNK),
    );
    expect(creditService.debitForCompletedChatbotTurn).toHaveBeenCalled();
  });

  it('tool call 1회 후 function_call_output으로 다음 round를 호출한다', async () => {
    openai.createResponseStream
      .mockResolvedValueOnce(
        eventsOf([
          {
            type: 'response.output_item.added',
            output_index: 0,
            item: {
              type: 'function_call',
              call_id: 'call_1',
              name: 'get_user_inventory',
              arguments: '',
            },
          },
          {
            type: 'response.function_call_arguments.delta',
            output_index: 0,
            delta: '{}',
          },
          {
            type: 'response.function_call_arguments.done',
            output_index: 0,
            arguments: '{}',
          },
          {
            type: 'response.completed',
            response: {
              id: 'resp_tool',
              model: 'gpt-test',
              output: [
                {
                  type: 'function_call',
                  call_id: 'call_1',
                  name: 'get_user_inventory',
                  arguments: '{}',
                },
              ],
              usage: {
                input_tokens: 20,
                output_tokens: 5,
                total_tokens: 25,
              },
            },
          },
        ]) as never,
      )
      .mockResolvedValueOnce(
        eventsOf([
          {
            type: 'response.output_text.delta',
            delta: '재료 기준으로 추천해요',
          },
          {
            type: 'response.completed',
            response: {
              id: 'resp_final',
              model: 'gpt-test',
              output: [],
              usage: {
                input_tokens: 30,
                output_tokens: 10,
                total_tokens: 40,
              },
            },
          },
        ]) as never,
      );

    const result = await handler.execute({
      userId: 2,
      message: '냉장고 재료로 추천',
      conversationId: 'conv_2',
      streamChannelId: 'ch_2',
    });

    expect(toolDispatcher.execute).toHaveBeenCalledWith(
      'get_user_inventory',
      {},
      expect.objectContaining({ userId: 2 }),
    );
    expect(openai.createResponseStream).toHaveBeenCalledTimes(2);
    expect(openai.createResponseStream).toHaveBeenNthCalledWith(
      2,
      [
        {
          type: 'function_call_output',
          call_id: 'call_1',
          output: '{"ok":true}',
        },
      ],
      expect.objectContaining({
        previousResponseId: 'resp_tool',
      }),
    );
    expect(result).toMatchObject({
      fullContent: '재료 기준으로 추천해요',
      usage: {
        promptTokens: 50,
        completionTokens: 15,
        totalTokens: 65,
      },
    });
    expect(conversations.saveLastResponseId).toHaveBeenCalledWith(
      2,
      'conv_2',
      'resp_final',
    );
    expect(redisPublish).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(CHATBOT_TOOL_CALL_STATUS.START),
    );
  });

  it('저장된 previous_response_id를 연속 턴에 사용한다', async () => {
    conversations.getLastResponseId.mockResolvedValue('resp_prev');
    openai.createResponseStream.mockResolvedValue(
      eventsOf([
        { type: 'response.output_text.delta', delta: '이어서 답해요' },
        {
          type: 'response.completed',
          response: {
            id: 'resp_next',
            model: 'gpt-test',
            output: [],
            usage: {
              input_tokens: 1,
              output_tokens: 1,
              total_tokens: 2,
            },
          },
        },
      ]) as never,
    );

    await handler.execute({
      userId: 3,
      message: '이어서',
      conversationId: 'conv_3',
    });

    expect(openai.createResponseStream).toHaveBeenCalledWith(
      [{ role: 'user', content: '이어서' }],
      expect.objectContaining({
        previousResponseId: 'resp_prev',
      }),
    );
    expect(conversations.saveLastResponseId).toHaveBeenCalledWith(
      3,
      'conv_3',
      'resp_next',
    );
  });

  it('API 오류를 error 이벤트로 전파한다', async () => {
    openai.createResponseStream.mockRejectedValue(new Error('openai down'));

    const result = await handler.execute({
      userId: 4,
      message: 'hi',
      conversationId: 'conv_4',
      streamChannelId: 'ch_4',
    });

    expect(result).toEqual({ error: 'openai down' });
    expect(conversations.saveLastResponseId).not.toHaveBeenCalled();
    expect(redisPublish).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining(CHATBOT_STREAM_EVENT_TYPES.ERROR),
    );
  });
});
