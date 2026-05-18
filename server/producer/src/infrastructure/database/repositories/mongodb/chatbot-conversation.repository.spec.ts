import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ChatbotConversation } from '@mealio/shared';
import { ChatbotConversationRepository } from './chatbot-conversation.repository';
import { encodeConversationListCursor } from './conversation-list-cursor';

const mockQuery = {
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn(),
};

const mockModel = {
  find: jest.fn().mockReturnValue(mockQuery),
  findOne: jest.fn(),
};

describe('ChatbotConversationRepository', () => {
  let repository: ChatbotConversationRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotConversationRepository,
        {
          provide: getModelToken(ChatbotConversation.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get(ChatbotConversationRepository);
    jest.clearAllMocks();
  });

  describe('findConversationListByUserId', () => {
    it('userId로 필터하고 updatedAt·conversationId 내림차순으로 조회한다', async () => {
      mockQuery.exec.mockResolvedValue([]);

      await repository.findConversationListByUserId(1, { limit: 20 });

      expect(mockModel.find).toHaveBeenCalledWith({ userId: 1 });
      expect(mockQuery.sort).toHaveBeenCalledWith({
        updatedAt: -1,
        conversationId: -1,
      });
      expect(mockQuery.limit).toHaveBeenCalledWith(21);
    });

    it('복합 커서가 있으면 $or 필터를 적용한다', async () => {
      mockQuery.exec.mockResolvedValue([]);
      const cursor = encodeConversationListCursor(
        new Date('2025-01-25T00:00:00.000Z'),
        'conv_b',
      );

      await repository.findConversationListByUserId(1, { limit: 10, cursor });

      expect(mockModel.find).toHaveBeenCalledWith({
        userId: 1,
        $or: [
          { updatedAt: { $lt: new Date('2025-01-25T00:00:00.000Z') } },
          {
            updatedAt: new Date('2025-01-25T00:00:00.000Z'),
            conversationId: { $lt: 'conv_b' },
          },
        ],
      });
    });

    it('다음 페이지가 있으면 마지막 항목 기준 복합 nextCursor를 반환한다', async () => {
      const lastReturnedUpdatedAt = new Date('2025-01-25T00:00:00.000Z');
      mockQuery.exec.mockResolvedValue([
        {
          conversationId: 'conv_a',
          title: '제목',
          updatedAt: lastReturnedUpdatedAt,
        },
        {
          conversationId: 'conv_b',
          title: null,
          updatedAt: new Date('2025-01-24T00:00:00.000Z'),
        },
      ]);

      const result = await repository.findConversationListByUserId(1, {
        limit: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].conversationId).toBe('conv_a');
      expect(result.nextCursor).toBe(
        encodeConversationListCursor(lastReturnedUpdatedAt, 'conv_a'),
      );
    });
  });
});
