import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventLog } from '@mealio/shared';
import type { EventLogDocument } from '@mealio/shared';

export interface CreateEventLogInput {
  type: string;
  actor: {
    type: 'user' | 'system' | 'admin';
    userId?: number;
    ipAddress?: string;
    userAgent?: string;
  };
  entity?: {
    type: string;
    id: number;
    name?: string;
  };
  payload?: Record<string, unknown>;
  metadata?: {
    platform?: string;
    version?: string;
    source?: string;
    referrer?: string;
    extra?: Record<string, unknown>;
  };
}

/**
 * Consumer 전용 EventLog 리포지토리 — 유저 이벤트 처리 시 EventLog 저장(Mongoose)
 */
@Injectable()
export class EventLogRepository {
  constructor(
    @InjectModel(EventLog.name)
    private readonly eventLogModel: Model<EventLogDocument>,
  ) {}

  async create(input: CreateEventLogInput): Promise<EventLogDocument> {
    const doc = new this.eventLogModel(input);
    return doc.save();
  }
}
