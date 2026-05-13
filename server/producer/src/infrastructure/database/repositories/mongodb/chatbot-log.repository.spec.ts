import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatbotLogRepository } from './chatbot-log.repository';
import { ChatbotLog, ChatbotLogDocument } from '@mealio/shared';

// Mock chainable query (find/findById 공통: select, lean, sort, limit, exec)
const mockQuery = {
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn(),
};

// A class-like function for the mock
const mockModel = jest.fn().mockImplementation((doc) => ({
  ...doc,
  save: jest.fn().mockResolvedValue(doc),
}));
// Assign static methods to the function object
mockModel.find = jest.fn().mockReturnValue(mockQuery);
mockModel.findById = jest.fn().mockReturnValue(mockQuery);

describe('ChatbotLogRepository', () => {
  let repository: ChatbotLogRepository;
  let model: Model<ChatbotLogDocument>;

  const mockChatbotLog = {
    userId: 1,
    role: 1,
    message: 'Hello',
    success: true,
  } as ChatbotLog;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotLogRepository,
        {
          provide: getModelToken(ChatbotLog.name),
          useValue: mockModel,
        },
      ],
    }).compile();

    repository = module.get<ChatbotLogRepository>(ChatbotLogRepository);
    model = module.get<Model<ChatbotLogDocument>>(
      getModelToken(ChatbotLog.name),
    );
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findById', () => {
    it('should find and return a log by id', async () => {
      const id = 'some-id';
      mockQuery.exec.mockResolvedValue(mockChatbotLog);

      const result = await repository.findById(id);

      expect(model.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(mockChatbotLog);
    });
  });

  describe('findByUserId', () => {
    it('should find and return logs by user id', async () => {
      const userId = 1;
      mockQuery.exec.mockResolvedValue([mockChatbotLog]);

      const result = await repository.findByUserId(userId, {
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      expect(model.find).toHaveBeenCalledWith({ userId });
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: 'desc' });
      expect(result).toEqual([mockChatbotLog]);
    });
  });

  describe('findByConversationId', () => {
    it('should find logs by conversationId and return sorted by createdAt', async () => {
      const conversationId = 'conv_abc123';
      const logs = [
        {
          ...mockChatbotLog,
          role: 'user',
          message: 'Hi',
          createdAt: new Date(),
        },
        {
          ...mockChatbotLog,
          role: 'assistant',
          message: 'Hello',
          createdAt: new Date(),
        },
      ];
      mockQuery.exec.mockResolvedValue(logs);

      const result = await repository.findByConversationId(conversationId);

      expect(model.find).toHaveBeenCalledWith({
        'context.conversationId': conversationId,
      });
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: 1, _id: 1 });
      expect(result).toEqual(logs);
    });

    it('should filter by userId when provided', async () => {
      const conversationId = 'conv_xyz';
      const userId = 1;
      mockQuery.exec.mockResolvedValue([]);

      await repository.findByConversationId(conversationId, userId);

      expect(model.find).toHaveBeenCalledWith({
        'context.conversationId': conversationId,
        userId,
      });
    });
  });
});
