import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Document } from 'mongoose';

// LLM 응답 메타데이터 서브스키마
class LLMMetadata {
  @Prop({ required: true, type: String })
  model: string; // 'gpt-4-turbo', 'gpt-3.5-turbo'

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

// 대화 컨텍스트 서브스키마
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
  timestamps: true, // createdAt, updatedAt 자동 생성
  // TTL은 아래 인덱스에서만 설정 (MongoDB TTL 인덱스 규칙)
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
  role: string; // Int 대신 명확한 String enum

  @Prop({ required: true, type: String, maxlength: 10000 })
  message: string;

  @Prop({ type: ConversationContext })
  context?: ConversationContext;

  @Prop({ type: LLMMetadata })
  llm?: LLMMetadata;

  @Prop({ type: Number, min: 0, max: 60000 }) // 최대 1분
  latency?: number; // milliseconds

  @Prop({ required: true, type: Boolean, default: true })
  success: boolean;

  @Prop({ type: String, maxlength: 1000 })
  error?: string;

  @Prop({ type: String, index: true })
  sessionId?: string; // 세션별 조회 최적화

  // timestamps: true 설정으로 자동 생성됨
  createdAt?: Date;
  updatedAt?: Date;
}

export type ChatbotLogDocument = HydratedDocument<ChatbotLog>;
export const ChatbotLogSchema = SchemaFactory.createForClass(ChatbotLog);

// 복합 인덱스 설정
ChatbotLogSchema.index({ userId: 1, createdAt: -1 }); // 사용자별 최근 대화
ChatbotLogSchema.index({ sessionId: 1, createdAt: 1 }); // 세션별 대화 순서
ChatbotLogSchema.index({ success: 1, createdAt: -1 }); // 에러 로그 조회
ChatbotLogSchema.index({ 'llm.model': 1, createdAt: -1 }); // 모델별 분석
ChatbotLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // TTL 인덱스
