import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EventLog,
  EventLogDocument,
} from '../../mongoose/schemas/event-log.schema';

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

  async findById(id: string): Promise<EventLog | null> {
    return this.eventLogModel.findById(id).exec();
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    cursor?: { id: string };
    where?: any;
    orderBy?: { [key: string]: 'asc' | 'desc' };
  }): Promise<EventLog[]> {
    const { skip, take, cursor, where, orderBy } = params;

    const queryConditions: any = { ...where };
    if (cursor) {
      queryConditions['_id'] = { $gt: cursor.id };
    }

    const query = this.eventLogModel.find(queryConditions);

    if (skip) {
      query.skip(skip);
    }
    if (take) {
      query.limit(take);
    }
    if (orderBy) {
      query.sort(orderBy);
    }

    return query.exec();
  }
}
