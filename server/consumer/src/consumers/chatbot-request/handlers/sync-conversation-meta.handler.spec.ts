import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatbotEventType } from '@mealio/shared';
import { OpenAIService } from 'src/integrations/openai/openai.service';
import { ChatbotConversationRepository } from 'src/persistence/repositories/mongodb/chatbot-conversation.repository';
import { SyncConversationMetaHandler } from './SyncConversationMetaHandler';

describe('SyncConversationMetaHandler', () => {
  let handler: SyncConversationMetaHandler;
  let openai: jest.Mocked<Pick<OpenAIService, 'createResponse'>>;
  let conversations: jest.Mocked<
    Pick<
      ChatbotConversationRepository,
      'hasTitle' | 'createWithTitle' | 'touchUpdatedAt'
    >
  >;

  beforeEach(async () => {
    openai = { createResponse: jest.fn() };
    conversations = {
      hasTitle: jest.fn().mockResolvedValue(false),
      createWithTitle: jest.fn().mockResolvedValue(undefined),
      touchUpdatedAt: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncConversationMetaHandler,
        { provide: OpenAIService, useValue: openai },
        { provide: ChatbotConversationRepository, useValue: conversations },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              if (key === 'OPENAI_TITLE_MODEL') return 'gpt-title-test';
              throw new Error(`missing ${key}`);
            },
          },
        },
      ],
    }).compile();

    handler = module.get(SyncConversationMetaHandler);
  });

  it('START이면 제목이 비어 있을 때 LLM 후 createWithTitle을 호출한다', async () => {
    openai.createResponse.mockResolvedValue({
      content: '  김치 요리 추천  ',
      finishReason: 'completed',
    });

    await handler.execute({
      userId: 1,
      conversationId: 'conv_a',
      userMessage: '김치로 뭐 해먹지',
      eventType: ChatbotEventType.START,
    });

    expect(openai.createResponse).toHaveBeenCalledWith(
      [{ role: 'user', content: '김치로 뭐 해먹지' }],
      expect.objectContaining({ model: 'gpt-title-test' }),
    );
    expect(conversations.createWithTitle).toHaveBeenCalledWith(
      1,
      'conv_a',
      '김치 요리 추천',
      'llm',
    );
    expect(conversations.touchUpdatedAt).not.toHaveBeenCalled();
  });

  it('START인데 이미 제목이 있으면 LLM을 호출하지 않는다', async () => {
    conversations.hasTitle.mockResolvedValue(true);

    await handler.execute({
      userId: 1,
      conversationId: 'conv_b',
      userMessage: 'hi',
      eventType: ChatbotEventType.START,
    });

    expect(openai.createResponse).not.toHaveBeenCalled();
    expect(conversations.createWithTitle).not.toHaveBeenCalled();
  });

  it('MESSAGE이면 touchUpdatedAt만 호출한다', async () => {
    await handler.execute({
      userId: 1,
      conversationId: 'conv_c',
      userMessage: '추가 질문',
      eventType: ChatbotEventType.MESSAGE,
    });

    expect(openai.createResponse).not.toHaveBeenCalled();
    expect(conversations.createWithTitle).not.toHaveBeenCalled();
    expect(conversations.touchUpdatedAt).toHaveBeenCalledWith(1, 'conv_c');
  });

  it('conversationId가 없으면 아무 것도 하지 않는다', async () => {
    await handler.execute({
      userId: 1,
      conversationId: '',
      userMessage: 'hi',
      eventType: ChatbotEventType.START,
    });

    expect(openai.createResponse).not.toHaveBeenCalled();
    expect(conversations.touchUpdatedAt).not.toHaveBeenCalled();
  });
});
