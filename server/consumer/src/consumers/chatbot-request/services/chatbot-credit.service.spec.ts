import { computeChatbotCreditCost, PrismaService } from '@mealio/shared';
import { KafkaProducerService } from 'src/integrations/kafka/kafka-producer.service';
import { ChatbotCreditService } from './chatbot-credit.service';

describe('ChatbotCreditService', () => {
  let service: ChatbotCreditService;
  let prisma: jest.Mocked<Pick<PrismaService, '$transaction'>>;
  let kafka: jest.Mocked<Pick<KafkaProducerService, 'emit'>>;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
    } as unknown as jest.Mocked<Pick<PrismaService, '$transaction'>>;
    kafka = {
      emit: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<Pick<KafkaProducerService, 'emit'>>;

    service = new ChatbotCreditService(
      prisma as unknown as PrismaService,
      kafka as unknown as KafkaProducerService,
    );
  });

  it('멱등 재호출 시 skippedDuplicate이고 잔액 기준 isCreditDepleted를 반환한다', async () => {
    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        return fn({
          chatbotCreditDeduction: {
            createMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
          user: {
            findUnique: jest.fn().mockResolvedValue({ creditBalance: 0 }),
          },
        });
      },
    );

    const r = await service.debitForCompletedChatbotTurn({
      userId: 1,
      streamChannelId: 'stream_abc123',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    });

    expect(r.skippedDuplicate).toBe(true);
    expect(r.isCreditDepleted).toBe(true);
    expect(kafka.emit).not.toHaveBeenCalled();
  });

  it('신규 차감 시 잔액이 0이면 isCreditDepleted true', async () => {
    prisma.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const cost = computeChatbotCreditCost({ totalTokens: 100 });
        return fn({
          chatbotCreditDeduction: {
            createMany: jest.fn().mockResolvedValue({ count: 1 }),
            update: jest.fn().mockResolvedValue(undefined),
          },
          user: {
            findUniqueOrThrow: jest
              .fn()
              .mockResolvedValueOnce({ creditBalance: cost })
              .mockResolvedValueOnce({ creditBalance: 0 }),
            update: jest.fn().mockResolvedValue(undefined),
          },
        });
      },
    );

    const r = await service.debitForCompletedChatbotTurn({
      userId: 2,
      streamChannelId: 'stream_new123',
      usage: { promptTokens: 50, completionTokens: 50, totalTokens: 100 },
    });

    expect(r.skippedDuplicate).toBe(false);
    expect(r.isCreditDepleted).toBe(true);
    expect(kafka.emit).toHaveBeenCalled();
  });
});
