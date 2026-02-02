import { Injectable } from '@nestjs/common';
import type { ChatbotRequestEvent } from '@cook/shared';
import { OpenAIService, type GenerateChatbotResponseResult } from '../../../integrations/openai/openai.service.js';

export type ProcessChatResult = GenerateChatbotResponseResult;

@Injectable()
export class ProcessChatHandler {
  constructor(private readonly openAIService: OpenAIService) {}

  async execute(event: ChatbotRequestEvent): Promise<ProcessChatResult> {
    const conversationId = event.conversationId ?? event.sessionId ?? 'unknown';

    return this.openAIService.generateChatbotResponse({
      userId: event.userId,
      message: event.message,
      conversationId,
    });
  }
}

