import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import {
  ChatbotLog,
  ChatbotLogDocument,
} from '../../mongoose/schemas/chatbot-log.schema';

@Injectable()
export class ChatbotLogRepository {
  constructor(
    @InjectModel(ChatbotLog.name)
    private readonly chatbotLogModel: Model<ChatbotLogDocument>,
  ) {}

  // Command 메서드들은 producer 서버에서 제거
  // Command 작업은 이벤트를 통해 consumer 서버에서 처리됨
  // async create(data: Partial<ChatbotLog>): Promise<ChatbotLog> {
  //   const createdLog = new this.chatbotLogModel(data);
  //   return createdLog.save();
  // }

  /**
   * ID로 대화 로그 조회 (읽기 전용: lean, 설계 5.3.2)
   */
  async findById(id: string): Promise<ChatbotLog | null> {
    return this.chatbotLogModel.findById(id).lean().exec();
  }

  /**
   * 사용자별 대화 로그 조회 (읽기 전용: lean + select, 설계 5.3.2)
   */
  async findByUserId(
    userId: number,
    params: {
      take?: number;
      orderBy?: { [key: string]: 'asc' | 'desc' };
    },
  ): Promise<ChatbotLog[]> {
    const { take, orderBy } = params;
    const query = this.chatbotLogModel
      .find({ userId })
      .select('userId role message context llm latency success sessionId createdAt')
      .lean();
    if (take) {
      query.limit(take);
    }
    if (orderBy && Object.keys(orderBy).length > 0) {
      query.sort(orderBy);
    }
    return query.exec();
  }

  /**
   * conversationId(또는 sessionId)로 대화 히스토리 조회 (GET /chatbot/conversations/:id)
   * @param conversationId 대화 ID
   * @param userId 선택: 지정 시 해당 사용자의 대화만 반환 (권한 검증용)
   */
  async findByConversationId(
    conversationId: string,
    userId?: number,
  ): Promise<ChatbotLog[]> {
    const filter: Record<string, unknown> = {
      $or: [
        { sessionId: conversationId },
        { 'context.conversationId': conversationId },
      ],
    };
    if (userId !== undefined) {
      filter.userId = userId;
    }
    return this.chatbotLogModel
      .find(filter)
      .select('role message context createdAt')
      .sort({ createdAt: 1 })
      .lean()
      .exec();
  }

  /**
   * 해당 유저의 대화 목록 조회 (GET /chatbot/conversations)
   * conversationId별 마지막 메시지 시각 기준 최신 순, 커서 기반 페이지네이션
   */
  async findConversationListByUserId(
    userId: number,
    params: { limit: number; cursor?: string },
  ): Promise<{
    items: Array<{ conversationId: string; lastMessageAt: Date }>;
    nextCursor: string | null;
  }> {
    const { limit, cursor } = params;
    const take = Math.min(limit + 1, 101);

    const pipeline: PipelineStage[] = [
      { $match: { userId } },
      {
        $addFields: {
          conversationId: {
            $ifNull: ['$sessionId', '$context.conversationId'],
          },
        },
      },
      { $match: { conversationId: { $nin: [null, ''] } } },
      {
        $group: {
          _id: '$conversationId',
          lastMessageAt: { $max: '$createdAt' },
        },
      },
      { $sort: { lastMessageAt: -1 } },
      { $limit: take },
    ];

    if (cursor) {
      try {
        const cursorDate = new Date(cursor);
        if (!Number.isNaN(cursorDate.getTime())) {
          pipeline.splice(4, 0, {
            $match: { lastMessageAt: { $lt: cursorDate } },
          } as PipelineStage);
        }
      } catch {
        // invalid cursor: ignore, return first page
      }
    }

    const raw = await this.chatbotLogModel
      .aggregate<{ _id: string; lastMessageAt: Date }>(pipeline)
      .exec();

    const hasMore = raw.length > limit;
    const items = (hasMore ? raw.slice(0, limit) : raw).map((doc) => ({
      conversationId: doc._id,
      lastMessageAt: doc.lastMessageAt,
    }));

    const nextCursor =
      hasMore && items.length > 0
        ? new Date(items[items.length - 1].lastMessageAt).toISOString()
        : null;

    return { items, nextCursor };
  }
}
