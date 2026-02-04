import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotService } from '../../chatbot.service';
import { KafkaProducerService } from '../../../../infrastructure/kafka/producer.service';
import { RedisService, KAFKA_TOPICS } from '@cook/shared';
import { ChatbotLogRepository } from '../../../../infrastructure/database/repositories/mongodb/chatbot-log.repository';
import type { SendMessageDto } from '../../dto/send-message.dto';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let kafkaProducer: jest.Mocked<KafkaProducerService>;
  let redisService: jest.Mocked<RedisService>;
  let chatbotLogRepository: jest.Mocked<ChatbotLogRepository>;

  beforeEach(async () => {
    const mockKafkaProducer = {
      emit: jest.fn().mockResolvedValue(undefined),
    };

    const mockRedisService = {
      subscribe: jest.fn().mockImplementation((_channel, onMessage) => {
        onMessage(
          JSON.stringify({
            type: 'done',
            data: { conversationId: 'conv_abc' },
          }),
        );
        return Promise.resolve(() => Promise.resolve());
      }),
    };

    const mockChatbotLogRepository = {
      findByConversationId: jest.fn().mockResolvedValue([]),
      findConversationListByUserId: jest.fn().mockResolvedValue({
        items: [],
        nextCursor: null,
      }),
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

    it('Redis에서 error 이벤트를 받으면 error 콜백을 호출한다', async () => {
      redisService.subscribe.mockImplementation((_ch, onMessage) => {
        onMessage(
          JSON.stringify({ type: 'error', data: { message: 'GPT 오류' } }),
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
      const items = [
        {
          conversationId: 'conv_a',
          lastMessageAt: new Date('2025-01-25T12:00:00.000Z'),
        },
      ];
      chatbotLogRepository.findConversationListByUserId.mockResolvedValue({
        items,
        nextCursor: null,
      });

      const result = await service.getConversationList(userId, 20);

      expect(
        chatbotLogRepository.findConversationListByUserId,
      ).toHaveBeenCalledWith(userId, { limit: 20, cursor: undefined });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].conversationId).toBe('conv_a');
      expect(result.items[0].lastMessageAt).toBe('2025-01-25T12:00:00.000Z');
      expect(result.nextCursor).toBeNull();
    });

    it('nextCursor가 있으면 그대로 반환한다', async () => {
      chatbotLogRepository.findConversationListByUserId.mockResolvedValue({
        items: [
          {
            conversationId: 'conv_b',
            lastMessageAt: new Date('2025-01-24T00:00:00.000Z'),
          },
        ],
        nextCursor: '2025-01-24T00:00:00.000Z',
      });

      const result = await service.getConversationList(
        1,
        1,
        '2025-01-25T00:00:00.000Z',
      );

      expect(
        chatbotLogRepository.findConversationListByUserId,
      ).toHaveBeenCalledWith(1, {
        limit: 1,
        cursor: '2025-01-25T00:00:00.000Z',
      });
      expect(result.nextCursor).toBe('2025-01-24T00:00:00.000Z');
    });
  });

  describe('getConversationHistory', () => {
    it('conversationId와 userId로 대화 히스토리를 조회한다 (추천 레시피는 ID 배열만)', async () => {
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
          context: { suggestedRecipeIds: [1, 2] },
          createdAt: new Date('2025-01-25T00:00:01.000Z'),
        },
      ];
      chatbotLogRepository.findByConversationId.mockResolvedValue(
        logs as never,
      );

      const result = await service.getConversationHistory(
        userId,
        conversationId,
      );

      expect(chatbotLogRepository.findByConversationId).toHaveBeenCalledWith(
        conversationId,
        userId,
      );
      expect(result).toEqual({
        conversationId,
        messages: [
          {
            role: 'user',
            message: '안녕',
            suggestedRecipeIds: null,
            createdAt: '2025-01-25T00:00:00.000Z',
          },
          {
            role: 'assistant',
            message: '안녕하세요',
            suggestedRecipeIds: [1, 2],
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
