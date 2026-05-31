import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type HydratedDocument, Document } from 'mongoose';
import { RECIPE_INGESTION_STATE_KEY } from '../../../constants/recipe-ingestion';

export type RecipeIngestionStateDocument =
  HydratedDocument<RecipeIngestionState>;

/**
 * Recipe ingestion API 페이징 커서 singleton (MongoDB)
 * @see agent/backend/guidelines/recipe_ingestion_guidelines.md §3.2
 */
@Schema({
  collection: 'recipe_ingestion_state',
  timestamps: { createdAt: false, updatedAt: true },
})
export class RecipeIngestionState extends Document {
  @Prop({
    required: true,
    unique: true,
    type: String,
    default: RECIPE_INGESTION_STATE_KEY,
  })
  key: string;

  /** 마지막으로 요청한 endIdx (없으면 fetch 시 0으로 간주) */
  @Prop({ required: true, type: Number, default: 0 })
  lastEndIdx: number;

  updatedAt?: Date;
}

export const RecipeIngestionStateSchema =
  SchemaFactory.createForClass(RecipeIngestionState);
