import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventLog, EventLogDocument } from '@mealio/shared';

@Injectable()
export class EventLogRepository {
  constructor(
    @InjectModel(EventLog.name)
    private readonly eventLogModel: Model<EventLogDocument>,
  ) {}

  // Command 메서드들은 producer 서버에서 제거
  // Command 작업은 이벤트를 통해 consumer 서버에서 처리됨
  // async create(data: Partial<EventLog>): Promise<EventLog> {
  //   const createdLog = new this.eventLogModel(data);
  //   return createdLog.save();
  // }

  /**
   * ID로 이벤트 로그 조회 (읽기 전용: lean, 설계 5.3.2)
   */
  async findById(id: string): Promise<EventLog | null> {
    return this.eventLogModel.findById(id).lean().exec();
  }

  /**
   * 이벤트 로그 목록 조회 (읽기 전용: lean + select, 설계 5.3.2)
   */
  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: { id: string };
    where?: Record<string, unknown>;
    orderBy?: { [key: string]: 'asc' | 'desc' };
  }): Promise<EventLog[]> {
    const { skip, take, cursor, orderBy } = params;
    const filter: Record<string, unknown> = {
      ...(params.where ?? {}),
      ...(cursor ? { _id: { $gt: cursor.id } } : {}),
    };

    const query = this.eventLogModel
      .find(filter)
      .select('type actor entity payload metadata occurredAt processedAt')
      .lean();

    if (skip) {
      query.skip(skip);
    }
    if (take) {
      query.limit(take);
    }
    if (orderBy && Object.keys(orderBy).length > 0) {
      query.sort(orderBy);
    }

    return query.exec();
  }
}
