import { Injectable } from '@nestjs/common';
import type { ChatbotRequestEvent } from '@cook/shared';
import { GenerateChatbotResponseResult, OpenAIService } from 'src/integrations/openai/openai.service';

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

