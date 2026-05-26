import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EventLog,
  KpiRollup,
  type EventLogDocument,
  type KpiRollupDocument,
} from '@mealio/shared';

export interface RollupResult {
  kpiId: string;
  date: string;
  value: number | null;
  numerator: number;
  denominator: number;
  stats: Record<string, number> | null;
}

/**
 * EventLog → kpi_rollups 일별 집계.
 * 외부 스케줄러(cron, ECS scheduled task)가 호출하는 것을 전제로 설계.
 * upsert 기반이므로 재실행 시 idempotent.
 */
@Injectable()
export class KpiRollupService {
  private readonly logger = new Logger(KpiRollupService.name);

  constructor(
    @InjectModel(EventLog.name)
    private readonly eventLogModel: Model<EventLogDocument>,
    @InjectModel(KpiRollup.name)
    private readonly kpiRollupModel: Model<KpiRollupDocument>,
  ) {}

  async rollupDate(dateStr: string): Promise<RollupResult[]> {
    const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    this.logger.log(`Rolling up KPIs for ${dateStr}`);

    const results = await Promise.all([
      this.rollupRecipeFavoriteCvr(dayStart, dayEnd, dateStr),
      this.rollupSearchClickRate(dayStart, dayEnd, dateStr),
      this.rollupRecommendationLatency(dayStart, dayEnd, dateStr),
    ]);

    for (const result of results) {
      await this.upsertRollup(result);
    }

    this.logger.log(
      `Completed ${results.length} KPI rollups for ${dateStr}`,
    );
    return results;
  }

  private async rollupRecipeFavoriteCvr(
    dayStart: Date,
    dayEnd: Date,
    dateStr: string,
  ): Promise<RollupResult> {
    const baseMatch = {
      occurredAt: { $gte: dayStart, $lt: dayEnd },
      'actor.userId': { $exists: true, $ne: null },
    };

    const [viewUsers, favUsers] = await Promise.all([
      this.eventLogModel.distinct('actor.userId', {
        ...baseMatch,
        type: 'recipe.view',
      }),
      this.eventLogModel.distinct('actor.userId', {
        ...baseMatch,
        type: 'recipe.favorites_add',
      }),
    ]);

    const denominator = viewUsers.length;
    const numerator = favUsers.length;
    const value = denominator > 0 ? numerator / denominator : null;

    return {
      kpiId: 'kpi_recipe_favorite_cvr',
      date: dateStr,
      value,
      numerator,
      denominator,
      stats: null,
    };
  }

  private async rollupSearchClickRate(
    dayStart: Date,
    dayEnd: Date,
    dateStr: string,
  ): Promise<RollupResult> {
    const range = { occurredAt: { $gte: dayStart, $lt: dayEnd } };

    const [queries, clicks] = await Promise.all([
      this.eventLogModel.countDocuments({ ...range, type: 'search.query' }),
      this.eventLogModel.countDocuments({ ...range, type: 'search.click' }),
    ]);

    return {
      kpiId: 'kpi_search_click_rate',
      date: dateStr,
      value: queries > 0 ? clicks / queries : null,
      numerator: clicks,
      denominator: queries,
      stats: null,
    };
  }

  private async rollupRecommendationLatency(
    dayStart: Date,
    dayEnd: Date,
    dateStr: string,
  ): Promise<RollupResult> {
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

    if (!result.length || result[0].count === 0) {
      return {
        kpiId: 'kpi_recommendation_e2e_latency',
        date: dateStr,
        value: null,
        numerator: 0,
        denominator: 0,
        stats: null,
      };
    }

    const { count, values } = result[0] as {
      count: number;
      values: number[];
    };
    const p50 = values[Math.floor(count * 0.5)] ?? 0;
    const p95 = values[Math.floor(count * 0.95)] ?? 0;
    const p99 = values[Math.floor(count * 0.99)] ?? 0;

    return {
      kpiId: 'kpi_recommendation_e2e_latency',
      date: dateStr,
      value: p95,
      numerator: count,
      denominator: 0,
      stats: { p50, p95, p99 },
    };
  }

  private async upsertRollup(result: RollupResult): Promise<void> {
    await this.kpiRollupModel.updateOne(
      { kpiId: result.kpiId, date: result.date },
      {
        $set: {
          value: result.value,
          numerator: result.numerator,
          denominator: result.denominator,
          stats: result.stats,
        },
      },
      { upsert: true },
    );
    this.logger.log(
      `${result.kpiId} date=${result.date} value=${result.value} num=${result.numerator} den=${result.denominator}`,
    );
  }
}
