import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ChatbotController } from '../../chatbot.controller';
import { ChatbotService } from '../../chatbot.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { AuthUser } from '../../../auth/types/request.types';

describe('ChatbotController', () => {
  let controller: ChatbotController;
  let chatbotService: jest.Mocked<ChatbotService>;

  const mockAuthUser: AuthUser = { id: 1 };

  const mockConversationHistory = {
    conversationId: 'conv_abc123',
    messages: [
      {
        role: 'user' as const,
        message: '안녕',
        suggestedRecipeIds: null as const,
        createdAt: '2025-01-25T00:00:00.000Z',
      },
      {
        role: 'assistant' as const,
        message: '안녕하세요',
        suggestedRecipeIds: [1, 2],
        createdAt: '2025-01-25T00:00:01.000Z',
      },
    ],
  };

  const mockConversationList = {
    items: [
      {
        conversationId: 'conv_abc123',
        lastMessageAt: '2025-01-25T12:00:00.000Z',
      },
    ],
    nextCursor: null,
  };

  beforeEach(async () => {
    const mockService = {
      streamMessage: jest
        .fn()
        .mockImplementation((_userId, _dto, callbacks) => {
          callbacks.write(
            JSON.stringify({
              type: 'done',
              data: { conversationId: 'conv_abc123' },
            }),
          );
          callbacks.end();
          return Promise.resolve();
        }),
      getConversationList: jest.fn().mockResolvedValue(mockConversationList),
      getConversationHistory: jest
        .fn()
        .mockResolvedValue(mockConversationHistory),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatbotController],
      providers: [{ provide: ChatbotService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChatbotController>(ChatbotController);
    chatbotService = module.get<ChatbotService>(
      ChatbotService,
    ) as jest.Mocked<ChatbotService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('sendMessage', () => {
    it('SSE 스트림으로 응답하고 streamMessage를 호출한다', async () => {
      const dto = { message: '오늘 저녁 뭐 해먹을까요?' };
      const mockRes = {
        setHeader: jest.fn(),
        flushHeaders: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };

      await controller.sendMessage(mockAuthUser, dto, mockRes as any);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'text/event-stream',
      );
      expect(chatbotService.streamMessage).toHaveBeenCalledWith(
        1,
        dto,
        expect.objectContaining({
          write: expect.any(Function),
          end: expect.any(Function),
          error: expect.any(Function),
        }),
      );
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('conversationId가 있으면 dto에 포함해 streamMessage에 전달한다', async () => {
      const dto = {
        message: '추가 질문',
        conversationId: 'conv_xyz',
      };
      const mockRes = {
        setHeader: jest.fn(),
        flushHeaders: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };

      await controller.sendMessage(mockAuthUser, dto, mockRes as any);

      expect(chatbotService.streamMessage).toHaveBeenCalledWith(
        1,
        dto,
        expect.any(Object),
      );
    });
  });

  describe('getConversationList', () => {
    it('대화 목록을 반환한다', async () => {
      const result = await controller.getConversationList(mockAuthUser, {});

      expect(chatbotService.getConversationList).toHaveBeenCalledWith(
        1,
        20,
        undefined,
      );
      expect(result).toEqual(mockConversationList);
    });

    it('limit와 cursor를 전달하면 서비스에 그대로 전달한다', async () => {
      await controller.getConversationList(mockAuthUser, {
        limit: 10,
        cursor: '2025-01-24T00:00:00.000Z',
      });

      expect(chatbotService.getConversationList).toHaveBeenCalledWith(
        1,
        10,
        '2025-01-24T00:00:00.000Z',
      );
    });
  });

  describe('getConversationHistory', () => {
    it('대화 히스토리를 반환한다', async () => {
      const conversationId = 'conv_abc123';
      const result = await controller.getConversationHistory(
        mockAuthUser,
        conversationId,
      );

      expect(chatbotService.getConversationHistory).toHaveBeenCalledWith(
        1,
        conversationId,
      );
      expect(result).toEqual(mockConversationHistory);
    });

    it('대화가 없으면 NotFoundException을 던진다', async () => {
      chatbotService.getConversationHistory.mockResolvedValue(null);

      await expect(
        controller.getConversationHistory(mockAuthUser, 'conv_none'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
