import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Document } from 'mongoose';

class LLMMetadata {
  @Prop({ required: true, type: String })
  model: string;

  @Prop({ required: true, type: Number })
  promptTokens: number;

  @Prop({ required: true, type: Number })
  completionTokens: number;

  @Prop({ required: true, type: Number })
  totalTokens: number;

  @Prop({ type: Number })
  temperature?: number;

  @Prop({ type: Number })
  maxTokens?: number;
}

/** 스트림·로그에 저장하는 레시피 요약 (검색 도구 결과의 부분 집합) */
export class SuggestedRecipeSummary {
  @Prop({ required: true, type: Number })
  id: number;

  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: Number })
  categoryId: number;

  @Prop({ required: true, type: String })
  categoryName: string;

  /** 레시피 대표 이미지 URL (없으면 null) */
  @Prop({ type: String, default: null })
  imageUrl: string | null;
}

class ConversationContext {
  @Prop({ type: String })
  conversationId?: string;

  @Prop({ type: [String] })
  previousMessageIds?: string[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  userPreferences?: Record<string, any>;

  @Prop({ type: [Number] })
  mentionedIngredientIds?: number[];

  @Prop({ type: [SuggestedRecipeSummary] })
  suggestedRecipes?: SuggestedRecipeSummary[];

  @Prop({
    type: {
      candidateCount: { type: Number },
      candidateRecipeIds: { type: [Number] },
      selectedRecipeIds: { type: [Number] },
      topScores: { type: [Number] },
    },
  })
  retrieval?: {
    candidateCount?: number;
    candidateRecipeIds?: number[];
    selectedRecipeIds?: number[];
    topScores?: number[];
  };
}

@Schema({
  collection: 'chatbot_logs',
  timestamps: true,
})
export class ChatbotLog extends Document {
  @Prop({ required: true, index: true, type: Number })
  userId: number;

  @Prop({
    required: true,
    type: String,
    enum: ['user', 'assistant', 'system'],
    index: true,
  })
  role: string;

  @Prop({ required: true, type: String, maxlength: 10000 })
  message: string;

  @Prop({ type: ConversationContext })
  context?: ConversationContext;

  @Prop({ type: LLMMetadata })
  llm?: LLMMetadata;

  @Prop({ type: Number, min: 0, max: 60000 })
  latency?: number;

  @Prop({ required: true, type: Boolean, default: true })
  success: boolean;

  @Prop({ type: String, maxlength: 1000 })
  error?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export type ChatbotLogDocument = HydratedDocument<ChatbotLog>;
export const ChatbotLogSchema = SchemaFactory.createForClass(ChatbotLog);

ChatbotLogSchema.index({ userId: 1, createdAt: -1 });
ChatbotLogSchema.index({
  userId: 1,
  'context.conversationId': 1,
  createdAt: 1,
  _id: 1,
});
ChatbotLogSchema.index({ success: 1, createdAt: -1 });
ChatbotLogSchema.index({ 'llm.model': 1, createdAt: -1 });
ChatbotLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
