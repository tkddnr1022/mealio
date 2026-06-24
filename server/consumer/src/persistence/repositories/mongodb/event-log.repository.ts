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

  async distinctUserIdsByTypeInRange(
    type: string,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<number[]> {
    const userIds = await this.eventLogModel.distinct('actor.userId', {
      type,
      occurredAt: { $gte: dayStart, $lt: dayEnd },
      'actor.userId': { $exists: true, $ne: null },
    });
    return userIds.filter(
      (userId): userId is number => typeof userId === 'number',
    );
  }

  async countByTypeInRange(
    type: string,
    dayStart: Date,
    dayEnd: Date,
  ): Promise<number> {
    return this.eventLogModel.countDocuments({
      type,
      occurredAt: { $gte: dayStart, $lt: dayEnd },
    });
  }

  async aggregateRecommendationLatencyInRange(
    dayStart: Date,
    dayEnd: Date,
  ): Promise<{ count: number; values: number[] } | null> {
    const result = await this.eventLogModel
      .aggregate([
        {
          $match: {
            type: 'recipe.favorites_add',
            occurredAt: { $gte: dayStart, $lt: dayEnd },
            processedAt: { $exists: true },
          },
        },
        {
          $project: {
            latencyMs: { $subtract: ['$processedAt', '$occurredAt'] },
          },
        },
        { $sort: { latencyMs: 1 } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            values: { $push: '$latencyMs' },
          },
        },
      ])
      .exec();

    const rows = result as Array<{ count: number; values: number[] }>;
    return rows[0] ?? null;
  }
}
