import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KpiRollup, type KpiRollupDocument } from '@mealio/shared';

export interface KpiRollupUpsertInput {
  kpiId: string;
  date: string;
  value: number | null;
  numerator: number;
  denominator: number;
  stats: Record<string, number> | null;
}

/**
 * Consumer 전용 KpiRollup 리포지토리
 */
@Injectable()
export class KpiRollupRepository {
  constructor(
    @InjectModel(KpiRollup.name)
    private readonly kpiRollupModel: Model<KpiRollupDocument>,
  ) {}

  async upsert(input: KpiRollupUpsertInput): Promise<void> {
    await this.kpiRollupModel.updateOne(
      { kpiId: input.kpiId, date: input.date },
      {
        $set: {
          value: input.value,
          numerator: input.numerator,
          denominator: input.denominator,
          stats: input.stats,
        },
      },
      { upsert: true },
    );
  }
}
