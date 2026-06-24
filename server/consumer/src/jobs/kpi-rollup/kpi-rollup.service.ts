import { Injectable, Logger } from '@nestjs/common';
import { EventLogRepository } from 'src/persistence/repositories/mongodb/event-log.repository';
import { KpiRollupRepository } from 'src/persistence/repositories/mongodb/kpi-rollup.repository';

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
    private readonly eventLogRepository: EventLogRepository,
    private readonly kpiRollupRepository: KpiRollupRepository,
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
      await this.kpiRollupRepository.upsert(result);
      this.logger.log(
        `${result.kpiId} date=${result.date} value=${result.value} num=${result.numerator} den=${result.denominator}`,
      );
    }

    this.logger.log(`Completed ${results.length} KPI rollups for ${dateStr}`);
    return results;
  }

  private async rollupRecipeFavoriteCvr(
    dayStart: Date,
    dayEnd: Date,
    dateStr: string,
  ): Promise<RollupResult> {
    const [viewUsers, favUsers] = await Promise.all([
      this.eventLogRepository.distinctUserIdsByTypeInRange(
        'recipe.view',
        dayStart,
        dayEnd,
      ),
      this.eventLogRepository.distinctUserIdsByTypeInRange(
        'recipe.favorites_add',
        dayStart,
        dayEnd,
      ),
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
    const [queries, clicks] = await Promise.all([
      this.eventLogRepository.countByTypeInRange(
        'search.query',
        dayStart,
        dayEnd,
      ),
      this.eventLogRepository.countByTypeInRange(
        'search.click',
        dayStart,
        dayEnd,
      ),
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
    const row =
      await this.eventLogRepository.aggregateRecommendationLatencyInRange(
        dayStart,
        dayEnd,
      );
    if (!row || row.count === 0) {
      return {
        kpiId: 'kpi_recommendation_e2e_latency',
        date: dateStr,
        value: null,
        numerator: 0,
        denominator: 0,
        stats: null,
      };
    }

    const { count, values } = row;
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
}
