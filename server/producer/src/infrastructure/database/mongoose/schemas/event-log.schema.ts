import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Document } from 'mongoose';

// Actor 서브스키마 (이벤트 주체)
class EventActor {
  @Prop({ required: true, type: String, enum: ['user', 'system', 'admin'] })
  type: string;

  @Prop({ type: Number })
  userId?: number;

  @Prop({ type: String })
  ipAddress?: string;

  @Prop({ type: String })
  userAgent?: string;
}

// Entity 서브스키마 (이벤트 대상)
class EventEntity {
  @Prop({ required: true, type: String })
  type: string; // 'recipe', 'ingredient', 'user', etc.

  @Prop({ required: true, type: Number })
  id: number;

  @Prop({ type: String })
  name?: string;
}

// Metadata 서브스키마
class EventMetadata {
  @Prop({ type: String })
  platform?: string; // 'web', 'ios', 'android'

  @Prop({ type: String })
  version?: string; // 앱 버전

  @Prop({ type: String })
  source?: string; // 'search', 'recommendation', 'direct'

  @Prop({ type: String })
  referrer?: string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  extra?: Record<string, any>;
}

@Schema({
  collection: 'event_logs',
  timestamps: { createdAt: 'occurredAt', updatedAt: 'processedAt' },
})
export class EventLog extends Document {
  @Prop({
    required: true,
    type: String,
    enum: [
      'recipe.view',
      'recipe.like',
      'recipe.share',
      'search.query',
      'search.click',
      'user.signup',
      'user.login',
      'ingredient.add',
      'ingredient.remove',
      'chatbot.start',
      'chatbot.message',
    ],
    index: true,
  })
  type: string; // Int 대신 명확한 String enum

  @Prop({ required: true, type: EventActor })
  actor: EventActor;

  @Prop({ type: EventEntity })
  entity?: EventEntity;

  @Prop({ type: MongooseSchema.Types.Mixed })
  payload?: Record<string, any>; // 이벤트별 추가 데이터

  @Prop({ type: EventMetadata })
  metadata?: EventMetadata;

  occurredAt?: Date; // createdAt 대신 사용
  processedAt?: Date; // updatedAt 대신 사용
}

export type EventLogDocument = HydratedDocument<EventLog>;
export const EventLogSchema = SchemaFactory.createForClass(EventLog);

// 복합 인덱스 설정
EventLogSchema.index({ 'actor.userId': 1, occurredAt: -1 }); // 사용자별 활동
EventLogSchema.index({ type: 1, occurredAt: -1 }); // 이벤트 타입별 조회
EventLogSchema.index({ 'entity.type': 1, 'entity.id': 1, occurredAt: -1 }); // 엔티티별 이벤트
EventLogSchema.index({ occurredAt: -1 }); // 최근 이벤트 조회
EventLogSchema.index({ 'metadata.platform': 1, type: 1 }); // 플랫폼별 분석
EventLogSchema.index({ occurredAt: 1 }, { expireAfterSeconds: 7776000 }); // 90일 TTL
