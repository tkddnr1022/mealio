import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotService } from '../../chatbot.service';
import { KafkaProducerService } from '../../../../infrastructure/kafka/producer.service';
import {
  RedisService,
  KAFKA_TOPICS,
  CHATBOT_STREAM_EVENT_TYPES,
} from '@mealio/shared';
import { ChatbotLogRepository } from '../../../../infrastructure/database/repositories/mongodb/chatbot-log.repository';
import { ChatbotConversationRepository } from '../../../../infrastructure/database/repositories/mongodb/chatbot-conversation.repository';
import { UserRepository } from '../../../../infrastructure/database/repositories/postgresql/user.repository';
import type { SendMessageDto } from '../../dto/send-message.dto';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let kafkaProducer: jest.Mocked<KafkaProducerService>;
  let redisService: jest.Mocked<RedisService>;
  let chatbotLogRepository: jest.Mocked<ChatbotLogRepository>;
  let chatbotConversationRepository: jest.Mocked<ChatbotConversationRepository>;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const mockKafkaProducer = {
      emit: jest.fn().mockResolvedValue(undefined),
    };

    const mockUserRepository = {
      findById: jest.fn().mockResolvedValue({
        id: 1,
        creditBalance: 100,
        creditMonthlyLimit: 1000,
      }),
    };

    const mockRedisService = {
      subscribe: jest.fn().mockImplementation((_channel, onMessage) => {
        onMessage(
          JSON.stringify({
            type: CHATBOT_STREAM_EVENT_TYPES.DONE,
            data: { conversationId: 'conv_abc', isCreditDepleted: false },
          }),
        );
        return Promise.resolve(() => Promise.resolve());
      }),
    };

    const mockChatbotLogRepository = {
      findByConversationId: jest.fn().mockResolvedValue([]),
    };

    const mockChatbotConversationRepository = {
      findConversationListByUserId: jest.fn().mockResolvedValue({
        items: [],
        nextCursor: null,
      }),
      findMetaByConversationId: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotService,
        { provide: KafkaProducerService, useValue: mockKafkaProducer },
        { provide: RedisService, useValue: mockRedisService },
        {
          provide: ChatbotLogRepository,
          useValue: mockChatbotLogRepository,
        },
        {
          provide: ChatbotConversationRepository,
          useValue: mockChatbotConversationRepository,
        },
        { provide: UserRepository, useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
    kafkaProducer = module.get(
      KafkaProducerService,
    ) as jest.Mocked<KafkaProducerService>;
    redisService = module.get(RedisService) as jest.Mocked<RedisService>;
    chatbotLogRepository = module.get(
      ChatbotLogRepository,
    ) as jest.Mocked<ChatbotLogRepository>;
    chatbotConversationRepository = module.get(
      ChatbotConversationRepository,
    ) as jest.Mocked<ChatbotConversationRepository>;
    userRepository = module.get(UserRepository) as jest.Mocked<UserRepository>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('streamMessage', () => {
    it('Kafka에 streamChannelId를 포함해 발행하고 Redis 채널을 구독한다', async () => {
      const userId = 1;
      const dto: SendMessageDto = { message: '오늘 저녁 뭘 해먹을까요?' };
      const write = jest.fn();
      const end = jest.fn();
      const error = jest.fn();

      await service.streamMessage(userId, dto, { write, end, error });

      expect(kafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.CHATBOT_REQUESTS,
        expect.objectContaining({
          userId: 1,
          message: dto.message,
          type: 'chatbot.start',
          streamChannelId: expect.stringMatching(/^stream_[a-z0-9]{16}$/),
          conversationId: expect.stringMatching(/^conv_[a-z0-9]{16}$/),
          timestamp: expect.any(String),
        }),
        'user_1',
      );
      expect(redisService.subscribe).toHaveBeenCalledWith(
        expect.stringMatching(/^chatbot:stream:stream_[a-z0-9]{16}$/),
        expect.any(Function),
      );
      expect(write).toHaveBeenCalled();
      expect(end).toHaveBeenCalled();
      expect(error).not.toHaveBeenCalled();
    });

    it('크레딧이 0이면 Kafka를 호출하지 않고 error 콜백을 호출한다', async () => {
      userRepository.findById.mockResolvedValue({
        id: 1,
        creditBalance: 0,
        creditMonthlyLimit: 1000,
      } as never);
      const write = jest.fn();
      const end = jest.fn();
      const error = jest.fn();

      await service.streamMessage(1, { message: 'hi' }, { write, end, error });

      expect(kafkaProducer.emit).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledWith(expect.any(Error));
      expect(write).not.toHaveBeenCalled();
    });

    it('Redis에서 error 이벤트를 받으면 error 콜백을 호출한다', async () => {
      redisService.subscribe.mockImplementation((_ch, onMessage) => {
        onMessage(
          JSON.stringify({
            type: CHATBOT_STREAM_EVENT_TYPES.ERROR,
            data: { message: 'GPT 오류' },
          }),
        );
        return Promise.resolve(() => Promise.resolve());
      });
      const write = jest.fn();
      const end = jest.fn();
      const error = jest.fn();

      await service.streamMessage(1, { message: 'hi' }, { write, end, error });

      expect(error).toHaveBeenCalledWith(expect.any(Error));
      expect(end).not.toHaveBeenCalled();
    });
  });

  describe('getConversationList', () => {
    it('대화 목록을 반환한다', async () => {
      const userId = 1;
      chatbotConversationRepository.findConversationListByUserId.mockResolvedValue(
        {
          items: [
            {
              conversationId: 'conv_a',
              title: '저녁 메뉴',
              updatedAt: new Date('2025-01-25T12:00:00.000Z'),
            },
          ],
          nextCursor: null,
        },
      );

      const result = await service.getConversationList(userId, 20);

      expect(
        chatbotConversationRepository.findConversationListByUserId,
      ).toHaveBeenCalledWith(userId, { limit: 20, cursor: undefined });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].conversationId).toBe('conv_a');
      expect(result.items[0].title).toBe('저녁 메뉴');
      expect(result.items[0].updatedAt).toBe('2025-01-25T12:00:00.000Z');
      expect(result.nextCursor).toBeNull();
    });

    it('nextCursor가 있으면 그대로 반환한다', async () => {
      chatbotConversationRepository.findConversationListByUserId.mockResolvedValue(
        {
          items: [
            {
              conversationId: 'conv_b',
              title: null,
              updatedAt: new Date('2025-01-24T00:00:00.000Z'),
            },
          ],
          nextCursor: '2025-01-24T00:00:00.000Z',
        },
      );

      const result = await service.getConversationList(
        1,
        1,
        '2025-01-25T00:00:00.000Z',
      );

      expect(
        chatbotConversationRepository.findConversationListByUserId,
      ).toHaveBeenCalledWith(1, {
        limit: 1,
        cursor: '2025-01-25T00:00:00.000Z',
      });
      expect(result.items[0].title).toBeNull();
      expect(result.nextCursor).toBe('2025-01-24T00:00:00.000Z');
    });
  });

  describe('getConversationHistory', () => {
    it('conversationId와 userId로 대화 히스토리를 조회한다 (추천 레시피는 요약 배열)', async () => {
      const userId = 1;
      const conversationId = 'conv_abc';
      const logs = [
        {
          userId: 1,
          role: 'user',
          message: '안녕',
          createdAt: new Date('2025-01-25T00:00:00.000Z'),
        },
        {
          userId: 1,
          role: 'assistant',
          message: '안녕하세요',
          context: {
            suggestedRecipes: [
              {
                id: 1,
                title: '레시피1',
                categoryId: 1,
                categoryName: '밥',
                imageUrl: null,
              },
              {
                id: 2,
                title: '레시피2',
                categoryId: 1,
                categoryName: '밥',
                imageUrl: 'https://cdn.example.com/2.jpg',
              },
            ],
          },
          createdAt: new Date('2025-01-25T00:00:01.000Z'),
        },
      ];
      chatbotLogRepository.findByConversationId.mockResolvedValue(
        logs as never,
      );
      chatbotConversationRepository.findMetaByConversationId.mockResolvedValue({
        conversationId,
        title: '인사',
        updatedAt: new Date('2025-01-25T00:00:00.000Z'),
        titleSource: 'llm',
      });

      const result = await service.getConversationHistory(
        userId,
        conversationId,
      );

      expect(chatbotLogRepository.findByConversationId).toHaveBeenCalledWith(
        conversationId,
        userId,
      );
      expect(
        chatbotConversationRepository.findMetaByConversationId,
      ).toHaveBeenCalledWith(userId, conversationId);
      expect(result).toEqual({
        conversationId,
        title: '인사',
        messages: [
          {
            role: 'user',
            message: '안녕',
            suggestedRecipes: null,
            createdAt: '2025-01-25T00:00:00.000Z',
          },
          {
            role: 'assistant',
            message: '안녕하세요',
            suggestedRecipes: [
              {
                id: 1,
                title: '레시피1',
                categoryId: 1,
                categoryName: '밥',
                imageUrl: null,
              },
              {
                id: 2,
                title: '레시피2',
                categoryId: 1,
                categoryName: '밥',
                imageUrl: 'https://cdn.example.com/2.jpg',
              },
            ],
            createdAt: '2025-01-25T00:00:01.000Z',
          },
        ],
      });
    });

    it('로그가 없으면 null을 반환한다', async () => {
      chatbotLogRepository.findByConversationId.mockResolvedValue([]);

      const result = await service.getConversationHistory(1, 'conv_empty');

      expect(result).toBeNull();
    });
  });
});
