import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document } from 'mongoose';

@Schema({
  collection: 'chatbot_conversations',
  timestamps: true,
})
export class ChatbotConversation extends Document {
  @Prop({ required: true, index: true, type: Number })
  userId: number;

  @Prop({ required: true, type: String })
  conversationId: string;

  /** 표시용 제목. MESSAGE만 오고 아직 제목이 없을 수 있음 */
  @Prop({ type: String, maxlength: 120 })
  title?: string;

  @Prop({
    type: String,
    enum: ['llm', 'manual'],
    default: 'llm',
  })
  titleSource?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export type ChatbotConversationDocument = HydratedDocument<ChatbotConversation>;
export const ChatbotConversationSchema =
  SchemaFactory.createForClass(ChatbotConversation);

ChatbotConversationSchema.index({ userId: 1, conversationId: 1 }, { unique: true });
ChatbotConversationSchema.index({ userId: 1, updatedAt: -1 });
