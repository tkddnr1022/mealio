import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ChatbotConversation } from '@mealio/shared';
import { ChatbotConversationRepository } from './chatbot-conversation.repository';

describe('ChatbotConversationRepository (consumer)', () => {
  let repository: ChatbotConversationRepository;
  let model: {
    findOne: jest.Mock;
    updateOne: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(async () => {
    model = {
      findOne: jest.fn(),
      updateOne: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatbotConversationRepository,
        {
          provide: getModelToken(ChatbotConversation.name),
          useValue: model,
        },
      ],
    }).compile();

    repository = module.get(ChatbotConversationRepository);
  });

  describe('getLastResponseId', () => {
    it('저장된 lastResponseId를 반환한다', async () => {
      model.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({ lastResponseId: 'resp_abc' }),
          }),
        }),
      });

      await expect(repository.getLastResponseId(1, 'conv_1')).resolves.toBe(
        'resp_abc',
      );
      expect(model.findOne).toHaveBeenCalledWith({
        userId: 1,
        conversationId: 'conv_1',
      });
    });

    it('없거나 unknown conversationId이면 undefined를 반환한다', async () => {
      await expect(
        repository.getLastResponseId(1, 'unknown'),
      ).resolves.toBeUndefined();

      model.findOne.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(null),
          }),
        }),
      });
      await expect(
        repository.getLastResponseId(1, 'conv_empty'),
      ).resolves.toBeUndefined();
    });
  });

  describe('saveLastResponseId', () => {
    it('upsert로 lastResponseId를 저장한다', async () => {
      model.updateOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ acknowledged: true }),
      });

      await repository.saveLastResponseId(2, 'conv_2', 'resp_new');

      expect(model.updateOne).toHaveBeenCalledWith(
        { userId: 2, conversationId: 'conv_2' },
        {
          $set: {
            lastResponseId: 'resp_new',
            updatedAt: expect.any(Date),
          },
          $setOnInsert: {
            userId: 2,
            conversationId: 'conv_2',
            createdAt: expect.any(Date),
          },
        },
        { upsert: true },
      );
    });

    it('unknown conversationId이면 저장하지 않는다', async () => {
      await repository.saveLastResponseId(2, 'unknown', 'resp_x');
      expect(model.updateOne).not.toHaveBeenCalled();
    });
  });
});
