import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatbotLog } from '@mealio/shared';
import type { ChatbotLogDocument } from '@mealio/shared';

/** 대화 히스토리 컨텍스트에 넣을 최근 메시지 수(상한). 토큰/윈도우 제한 고려. */
export const DEFAULT_RECENT_TURNS_LIMIT = 20;

export interface RecentTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface FindRecentTurnsOptions {
  conversationId?: string;
}

/**
 * ChatbotLog 조회: 동일 대화(conversationId) 내 최근 턴을 createdAt·_id 순으로 반환.
 * ProcessChatHandler에서 buildMessagesForGpt의 previousTurns 공급용.
 */
@Injectable()
export class ChatbotLogRepository {
  constructor(
    @InjectModel(ChatbotLog.name)
    private readonly chatbotLogModel: Model<ChatbotLogDocument>,
  ) {}

  async findRecentTurns(
    userId: number,
    options: FindRecentTurnsOptions,
    limit: number = DEFAULT_RECENT_TURNS_LIMIT,
  ): Promise<RecentTurn[]> {
    const { conversationId } = options;
    if (!conversationId) {
      return [];
    }

    const filter: Record<string, unknown> = {
      userId,
      'context.conversationId': conversationId,
    };

    const docs = await this.chatbotLogModel
      .find(filter)
      .sort({ createdAt: 1, _id: 1 })
      .limit(limit)
      .select('role message')
      .lean()
      .exec();

    return docs
      .filter(
        (d) =>
          d.role === 'user' || d.role === 'assistant' || d.role === 'system',
      )
      .map((d) => ({
        role: d.role as 'user' | 'assistant' | 'system',
        content: typeof d.message === 'string' ? d.message : '',
      }));
  }
}
