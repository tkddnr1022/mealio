import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Document } from 'mongoose';

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

class EventEntity {
  @Prop({ required: true, type: String })
  type: string;

  @Prop({ required: true, type: Number })
  id: number;

  @Prop({ type: String })
  name?: string;
}

class EventMetadata {
  @Prop({ type: String })
  platform?: string;

  @Prop({ type: String })
  version?: string;

  @Prop({ type: String })
  source?: string;

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
      'user.nickname.update',
      'ingredient.add',
      'ingredient.remove',
      'user.ingredient.bulk_update',
      'user.ingredient.favorites_update',
      'chatbot.start',
      'chatbot.message',
    ],
    index: true,
  })
  type: string;

  @Prop({ required: true, type: EventActor })
  actor: EventActor;

  @Prop({ type: EventEntity })
  entity?: EventEntity;

  @Prop({ type: MongooseSchema.Types.Mixed })
  payload?: Record<string, any>;

  @Prop({ type: EventMetadata })
  metadata?: EventMetadata;

  occurredAt?: Date;
  processedAt?: Date;
}

export type EventLogDocument = HydratedDocument<EventLog>;
export const EventLogSchema = SchemaFactory.createForClass(EventLog);

EventLogSchema.index({ 'actor.userId': 1, occurredAt: -1 });
EventLogSchema.index({ type: 1, occurredAt: -1 });
EventLogSchema.index({ 'entity.type': 1, 'entity.id': 1, occurredAt: -1 });
EventLogSchema.index({ occurredAt: -1 });
EventLogSchema.index({ 'metadata.platform': 1, type: 1 });
EventLogSchema.index({ occurredAt: 1 }, { expireAfterSeconds: 7776000 });
