import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Document } from 'mongoose';

/**
 * 일별 KPI 롤업 결과 저장.
 * EventLog(TTL 90일) 원본을 집계해 YoY 비교 가능하도록 400일 보관한다.
 */
@Schema({
  collection: 'kpi_rollups',
  timestamps: { createdAt: 'computedAt', updatedAt: false },
})
export class KpiRollup extends Document {
  @Prop({ required: true, type: String, index: true })
  kpiId: string;

  @Prop({ required: true, type: String })
  date: string;

  @Prop({ type: Number, default: null })
  value: number | null;

  @Prop({ type: Number, default: 0 })
  numerator: number;

  @Prop({ type: Number, default: 0 })
  denominator: number;

  /** p50/p95/p99 등 분포 KPI에 사용하는 보조 필드 */
  @Prop({ type: Object, default: null })
  stats: Record<string, number> | null;

  computedAt?: Date;
}

export type KpiRollupDocument = HydratedDocument<KpiRollup>;
export const KpiRollupSchema = SchemaFactory.createForClass(KpiRollup);

KpiRollupSchema.index({ kpiId: 1, date: 1 }, { unique: true });
KpiRollupSchema.index({ kpiId: 1, computedAt: -1 });
KpiRollupSchema.index(
  { computedAt: 1 },
  { expireAfterSeconds: 34560000 },
);
