import { Injectable, Logger } from '@nestjs/common';

interface GenerateChatbotResponseParams {
  userId: number;
  message: string;
  conversationId: string;
}

export interface GenerateChatbotResponseResult {
  conversationId: string;
  reply: string;
  suggestedRecipes: Array<{ id: number; title: string; matchScore: number }> | null;
}

/**
 * OpenAI 연동용 서비스 (1페이즈에서는 Stub 구현)
 *
 * 추후 실제 OpenAI API 호출 로직으로 교체한다.
 */
@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);

  async generateChatbotResponse(
    params: GenerateChatbotResponseParams,
  ): Promise<GenerateChatbotResponseResult> {
    // TODO: 실제 OpenAI 호출로 교체
    this.logger.debug(
      `Stub generateChatbotResponse called (userId=${params.userId}, conversationId=${params.conversationId})`,
    );

    const reply = `테스트 응답입니다. 당신의 메시지: "${params.message}"`;

    return {
      conversationId: params.conversationId,
      reply,
      suggestedRecipes: null,
    };
  }
}

