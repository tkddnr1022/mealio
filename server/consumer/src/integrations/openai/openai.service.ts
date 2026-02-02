import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

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
 * OpenAI 연동용 서비스
 * - Chatbot 전용 프롬프트로 단일 응답 생성
 * - (Phase 2) 추후 레시피 추천/구조화 응답 확장 가능
 */
@Injectable()
export class OpenAIService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('OPENAI_API_KEY');
    this.client = new OpenAI({ apiKey });
    this.model = this.configService.getOrThrow<string>('OPENAI_CHAT_MODEL');
  }

  async generateChatbotResponse(
    params: GenerateChatbotResponseParams,
  ): Promise<GenerateChatbotResponseResult> {
    const { userId, message, conversationId } = params;

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              '당신은 사용자의 보유 재료와 선호도를 기반으로 레시피를 추천해주는 한국어 요리 도우미 챗봇입니다. ' +
              '가능하면 간결하게 답하고, 재료 대체 제안도 함께 제공해 주세요.',
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
      } as any);

      const content = completion.choices?.[0]?.message?.content;
      const reply =
        typeof content === 'string'
          ? content
          : Array.isArray(content)
          ? (content as Array<{ text: string }>).map((c) => c.text ?? '').join('')
          : '';

    return {
        conversationId,
        reply,
        // Phase 2 범위에서는 추천 레시피 ID/스코어 파싱은 생략하고, 추후 JSON 응답 파서로 확장
        suggestedRecipes: null,
      };
  }
}
