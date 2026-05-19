import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ChatbotLog,
  SuggestedRecipeSummary,
  type ChatbotLogDocument,
} from '@mealio/shared';

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
  retrieval?: {
    candidateCount: number;
    candidateRecipeIds?: number[];
    selectedRecipeIds: number[];
    topScores: number[];
  };
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
      retrieval,
    } = payload;

    const userContext = { conversationId };
    const assistantContext = {
      conversationId,
      suggestedRecipes: suggestedRecipes ?? [],
      retrieval,
    };

    await this.chatbotLogModel.insertMany([
      {
        userId,
        role: 'user',
        message: userMessage.slice(0, 10000),
        context: userContext,
        success: true,
      },
      {
        userId,
        role: 'assistant',
        message: assistantMessage.slice(0, 10000),
        context: assistantContext,
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
