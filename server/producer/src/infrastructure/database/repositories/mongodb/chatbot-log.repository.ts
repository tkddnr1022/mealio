import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async create(data: Partial<ChatbotLog>): Promise<ChatbotLog> {
    const createdLog = new this.chatbotLogModel(data);
    return createdLog.save();
  }

  async findById(id: string): Promise<ChatbotLog | null> {
    return this.chatbotLogModel.findById(id).exec();
  }

  async findByUserId(
    userId: number,
    params: {
      take?: number;
      orderBy?: { [key: string]: 'asc' | 'desc' };
    },
  ): Promise<ChatbotLog[]> {
    const { take, orderBy } = params;
    const query = this.chatbotLogModel.find({ userId });
    if (take) {
      query.limit(take);
    }
    return query.sort(orderBy).exec();
  }
}
