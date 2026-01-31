import { Test, TestingModule } from '@nestjs/testing';
import { ChatbotService } from '../../chatbot.service';
import { KafkaProducerService } from '../../../../infrastructure/kafka/producer.service';
import { ChatbotLogRepository } from '../../../../infrastructure/database/repositories/mongodb/chatbot-log.repository';
import { KAFKA_TOPICS } from '../../../../shared/constants/kafka-topics';
import type { SendMessageDto } from '../../dto/send-message.dto';

describe('ChatbotService', () => {
  let service: ChatbotService;
  let kafkaProducer: jest.Mocked<KafkaProducerService>;
  let chatbotLogRepository: jest.Mocked<ChatbotLogRepository>;

  beforeEach(async () => {
    const mockKafkaProducer = {
      emit: jest.fn().mockResolvedValue(undefined),
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
        {
          provide: ChatbotLogRepository,
          useValue: mockChatbotLogRepository,
        },
      ],
    }).compile();

    service = module.get<ChatbotService>(ChatbotService);
    kafkaProducer = module.get(KafkaProducerService) as jest.Mocked<KafkaProducerService>;
    chatbotLogRepository = module.get(
      ChatbotLogRepository,
    ) as jest.Mocked<ChatbotLogRepository>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendMessage', () => {
    it('Kafka에 챗봇 요청 이벤트를 발행하고 접수 응답을 반환한다', async () => {
      const userId = 1;
      const dto: SendMessageDto = { message: '오늘 저녁 뭘 해먹을까요?' };

      const result = await service.sendMessage(userId, dto);

      expect(kafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.CHATBOT_REQUESTS,
        expect.objectContaining({
          userId: 1,
          message: dto.message,
          conversationId: expect.stringMatching(/^conv_[a-z0-9]{16}$/),
          sessionId: expect.stringMatching(/^conv_[a-z0-9]{16}$/),
          timestamp: expect.any(String),
        }),
        'user_1',
      );
      expect(result.conversationId).toMatch(/^conv_[a-z0-9]{16}$/);
      expect(result.message).toContain('접수');
      expect(result.suggestedRecipes).toBeNull();
    });

    it('conversationId가 있으면 해당 ID를 사용한다', async () => {
      const userId = 1;
      const dto: SendMessageDto = {
        message: '추가 질문',
        conversationId: 'conv_existing123',
      };

      const result = await service.sendMessage(userId, dto);

      expect(kafkaProducer.emit).toHaveBeenCalledWith(
        KAFKA_TOPICS.CHATBOT_REQUESTS,
        expect.objectContaining({
          conversationId: 'conv_existing123',
          sessionId: 'conv_existing123',
        }),
        expect.any(String),
      );
      expect(result.conversationId).toBe('conv_existing123');
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
      expect(result.items[0].lastMessageAt).toBe(
        '2025-01-25T12:00:00.000Z',
      );
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

      const result = await service.getConversationList(1, 1, '2025-01-25T00:00:00.000Z');

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
      chatbotLogRepository.findByConversationId.mockResolvedValue(logs as never);

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
