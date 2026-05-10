import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ChatbotLog,
  SuggestedRecipeSummary,
  type ChatbotLogDocument,
} from '@cook/shared';

export interface SaveChatLogPayload {
  userId: number;
  conversationId?: string;
  userMessage: string;
  assistantMessage: string;
  success: boolean;
  error?: string;
  suggestedRecipes?: SuggestedRecipeSummary[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}

/**
 * 스트림 종료 후 Mongoose ChatbotLog 저장 (user 턴 + assistant 턴)
 */
@Injectable()
export class SaveChatLogHandler {
  constructor(
    @InjectModel(ChatbotLog.name)
    private readonly chatbotLogModel: Model<ChatbotLogDocument>,
  ) {}

  async execute(payload: SaveChatLogPayload): Promise<void> {
    const {
      userId,
      conversationId,
      userMessage,
      assistantMessage,
      success,
      error,
      suggestedRecipes,
      usage,
      model,
    } = payload;

    const baseContext = {
      conversationId,
      suggestedRecipes: suggestedRecipes ?? [],
    };

    await this.chatbotLogModel.insertMany([
      {
        userId,
        role: 'user',
        message: userMessage.slice(0, 10000),
        context: baseContext,
        success: true,
      },
      {
        userId,
        role: 'assistant',
        message: assistantMessage.slice(0, 10000),
        context: baseContext,
        llm: {
          model,
          ...usage,
        },
        success,
        error: error?.slice(0, 1000),
      },
    ]);
  }
}
