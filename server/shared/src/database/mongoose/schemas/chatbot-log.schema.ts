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

class ConversationContext {
  @Prop({ type: String })
  sessionId?: string;

  @Prop({ type: String })
  conversationId?: string;

  @Prop({ type: [String] })
  previousMessageIds?: string[];

  @Prop({ type: MongooseSchema.Types.Mixed })
  userPreferences?: Record<string, any>;

  @Prop({ type: [Number] })
  mentionedIngredientIds?: number[];

  @Prop({ type: [Number] })
  suggestedRecipeIds?: number[];
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

  @Prop({ type: String, index: true })
  sessionId?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export type ChatbotLogDocument = HydratedDocument<ChatbotLog>;
export const ChatbotLogSchema = SchemaFactory.createForClass(ChatbotLog);

ChatbotLogSchema.index({ userId: 1, createdAt: -1 });
ChatbotLogSchema.index({ sessionId: 1, createdAt: 1 });
ChatbotLogSchema.index({ userId: 1, 'context.conversationId': 1, createdAt: 1 });
ChatbotLogSchema.index({ success: 1, createdAt: -1 });
ChatbotLogSchema.index({ 'llm.model': 1, createdAt: -1 });
ChatbotLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
