import { Injectable, Logger } from '@nestjs/common';
import {
  PrismaService,
  computeChatbotCreditCost,
  KAFKA_TOPICS,
  CacheInvalidationEventType,
  type CacheInvalidationUserProfilePayload,
} from '@cook/shared';
import { KafkaProducerService } from 'src/integrations/kafka/kafka-producer.service';

export interface DebitChatbotTurnParams {
  userId: number;
  streamChannelId: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface DebitChatbotTurnResult {
  /** 차감 후 잔액이 0 이하이면 true */
  isCreditDepleted: boolean;
  /** Kafka 재처리 등으로 이미 동일 stream에 대해 차감이 기록된 경우 */
  skippedDuplicate: boolean;
}

/**
 * 챗봇 턴 완료 시 크레딧 멱등 차감.
 * `stream_channel_id` PK로 동일 스트림 요청의 이중 차감을 방지한다.
 */
@Injectable()
export class ChatbotCreditService {
  private readonly logger = new Logger(ChatbotCreditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

  async debitForCompletedChatbotTurn(
    params: DebitChatbotTurnParams,
  ): Promise<DebitChatbotTurnResult> {
    const { userId, streamChannelId, usage } = params;

    const outcome = await this.prisma.$transaction(async (tx) => {
      const insert = await tx.chatbotCreditDeduction.createMany({
        data: [
          {
            streamChannelId,
            userId,
            credits: 0,
          },
        ],
        skipDuplicates: true,
      });

      if (insert.count === 0) {
        const u = await tx.user.findUnique({ where: { id: userId } });
        return {
          duplicate: true,
          balanceAfter: u?.creditBalance ?? 0,
        };
      }

      const before = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      const rawCost = computeChatbotCreditCost(usage);
      const applied = Math.min(rawCost, Math.max(0, before.creditBalance));

      if (applied > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { creditBalance: { decrement: applied } },
        });
      }

      await tx.chatbotCreditDeduction.update({
        where: { streamChannelId },
        data: { credits: applied },
      });

      const after = await tx.user.findUniqueOrThrow({ where: { id: userId } });
      return { duplicate: false, balanceAfter: after.creditBalance };
    });

    if (!outcome.duplicate) {
      try {
        const payload: CacheInvalidationUserProfilePayload = {
          type: CacheInvalidationEventType.USER_PROFILE,
          userId,
        };
        await this.kafkaProducerService.emit(
          KAFKA_TOPICS.CACHE_INVALIDATION,
          payload,
          String(userId),
        );
      } catch (err) {
        this.logger.warn(
          `User profile cache invalidation emit failed userId=${userId}`,
          err as Error,
        );
      }
    }

    return {
      isCreditDepleted: outcome.balanceAfter <= 0,
      skippedDuplicate: outcome.duplicate,
    };
  }
}
