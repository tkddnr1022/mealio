import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  type HydratedDocument,
  Document,
  Schema as MongooseSchema,
} from 'mongoose';
import {
  RECIPE_INGESTION_JOB_STATUSES,
  type RecipeIngestionJobStatus,
} from '../../../constants/recipe-ingestion';

export type { RecipeIngestionJobStatus };

export type RecipeIngestionJobDocument = HydratedDocument<RecipeIngestionJob>;

/**
 * Recipe ingestion 파이프라인 job SSOT (MongoDB)
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §3.1
 */
@Schema({
  collection: 'recipe_ingestion_jobs',
  timestamps: false,
})
export class RecipeIngestionJob extends Document {
  /** 공공데이터 API RCP_SEQ — upsert 멱등 키 */
  @Prop({ required: true, unique: true, type: Number, index: true })
  sourceId: number;

  /** 파이프라인 단계 — `RECIPE_INGESTION_JOB_STATUSES` */
  @Prop({
    required: true,
    type: String,
    enum: RECIPE_INGESTION_JOB_STATUSES,
    index: true,
  })
  status: RecipeIngestionJobStatus;

  @Prop({ required: true, type: Number, default: 0 })
  retryCount: number;

  @Prop({ type: MongooseSchema.Types.Mixed })
  rawData?: Record<string, unknown>;

  @Prop({ type: String, index: true })
  batchId?: string;

  @Prop({ type: String, index: true })
  runId?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  retrievedData?: Record<string, unknown>;

  @Prop({ type: String })
  errorMessage?: string;

  /** fetch upsert 시각 (`fetched_at`) */
  @Prop({ type: Date })
  fetchedAt?: Date;

  /** parse/embed Batch 제출 완료 시각 (`submitted_at`). embed 단계 재설정 시 parse 제출 시각을 덮어씀 */
  @Prop({ type: Date })
  submittedAt?: Date;

  /** parse/embed Batch 결과 반영 시각 (`retrieved_at`). embed 단계 재설정 시 parse retrieve 시각을 덮어씀 */
  @Prop({ type: Date })
  retrievedAt?: Date;

  /** persist 완료 시각 (`persisted_at`) */
  @Prop({ type: Date })
  persistedAt?: Date;

  /** persist 단계에서 matchMethod=new로 신규 생성된 재료 ID 목록 (`new_ingredient_ids`) */
  @Prop({ type: [Number], default: undefined })
  newIngredientIds?: number[];

  /** `failed` 전환 시각 (`failed_at`) */
  @Prop({ type: Date })
  failedAt?: Date;
}

export const RecipeIngestionJobSchema =
  SchemaFactory.createForClass(RecipeIngestionJob);

RecipeIngestionJobSchema.index({ status: 1, retryCount: 1 });
RecipeIngestionJobSchema.index({ batchId: 1, status: 1 });
RecipeIngestionJobSchema.index({ runId: 1, status: 1 });
