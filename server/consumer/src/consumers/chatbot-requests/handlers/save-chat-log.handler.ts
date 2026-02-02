import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatbotLog, type ChatbotLogDocument, type ChatbotRequestEvent } from '@cook/shared';
import type { ProcessChatResult } from './process-chat.handler';

@Injectable()
export class SaveChatLogHandler {
  constructor(
    @InjectModel(ChatbotLog.name)
    private readonly chatbotLogModel: Model<ChatbotLogDocument>,
  ) {}

  async execute(
    event: ChatbotRequestEvent,
    processed: ProcessChatResult,
  ): Promise<void> {
    const conversationId = event.conversationId ?? event.sessionId ?? 'unknown';

    const contextBase = {
      sessionId: event.sessionId,
      conversationId,
    };

    const assistantContext =
      processed.suggestedRecipes && processed.suggestedRecipes.length > 0
        ? {
            ...contextBase,
            suggestedRecipeIds: processed.suggestedRecipes.map((r) => r.id),
          }
        : contextBase;

    await this.chatbotLogModel.insertMany([
      {
        userId: event.userId,
        role: 'user',
        message: event.message,
        context: contextBase,
        success: true,
        sessionId: event.sessionId,
        createdAt: new Date(event.timestamp),
        updatedAt: new Date(event.timestamp),
      },
      {
        userId: event.userId,
        role: 'assistant',
        message: processed.reply,
        context: assistantContext,
        success: true,
        sessionId: event.sessionId,
      },
    ]);
  }
}

