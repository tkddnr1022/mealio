import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Document, Schema as MongooseSchema } from 'mongoose';
import {
  RECIPE_INGESTION_JOB_STATUSES,
  type RecipeIngestionJobStatus,
} from '../../../constants/recipe-ingestion';

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
  @Prop({ required: true, unique: true, type: String, index: true })
  sourceId: string;

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

  @Prop({ type: MongooseSchema.Types.Mixed })
  retrievedData?: Record<string, unknown>;

  @Prop({ type: String })
  errorMessage?: string;

  @Prop({ type: Date })
  fetchedAt?: Date;

  @Prop({ type: Date })
  submittedAt?: Date;

  @Prop({ type: Date })
  retrievedAt?: Date;

  @Prop({ type: Date })
  persistedAt?: Date;

  @Prop({ type: Date })
  failedAt?: Date;
}

export const RecipeIngestionJobSchema =
  SchemaFactory.createForClass(RecipeIngestionJob);

RecipeIngestionJobSchema.index({ status: 1, retryCount: 1 });
RecipeIngestionJobSchema.index({ batchId: 1, status: 1 });
