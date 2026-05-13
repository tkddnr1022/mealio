import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatbotLog, ChatbotLogDocument } from '@mealio/shared';

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
      .select('userId role message context llm latency success createdAt')
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
   * conversationId로 대화 히스토리 조회 (GET /chatbot/conversations/:id)
   * @param conversationId 대화 ID
   * @param userId 선택: 지정 시 해당 사용자의 대화만 반환 (권한 검증용)
   */
  async findByConversationId(
    conversationId: string,
    userId?: number,
  ): Promise<ChatbotLog[]> {
    const filter: Record<string, unknown> = {
      'context.conversationId': conversationId,
    };
    if (userId !== undefined) {
      filter.userId = userId;
    }
    return this.chatbotLogModel
      .find(filter)
      .select('role message context createdAt')
      .sort({ createdAt: 1, _id: 1 })
      .lean()
      .exec();
  }
}
