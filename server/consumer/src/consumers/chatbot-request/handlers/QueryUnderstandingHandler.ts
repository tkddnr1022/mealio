import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from 'src/integrations/openai/openai.service';

export interface StructuredRecipeIntent {
  keywords: string[];
  mustHaveIngredients: string[];
  avoidIngredients: string[];
  maxCookTime: number | null;
  servings: number | null;
  dietaryTags: string[];
  intentType: 'recommend' | 'search' | 'cook-guide' | 'other';
}

const EMPTY_INTENT: StructuredRecipeIntent = {
  keywords: [],
  mustHaveIngredients: [],
  avoidIngredients: [],
  maxCookTime: null,
  servings: null,
  dietaryTags: [],
  intentType: 'other',
};

@Injectable()
export class QueryUnderstandingHandler {
  private readonly logger = new Logger(QueryUnderstandingHandler.name);

  constructor(private readonly openai: OpenAIService) {}

  async execute(message: string): Promise<StructuredRecipeIntent> {
    if (message.trim().length === 0) {
      return EMPTY_INTENT;
    }

    const completion = await this.openai.createChatCompletion(
      [
        {
          role: 'system',
          content:
            '사용자 레시피 요청을 구조화된 JSON으로만 반환하세요. 스키마 외 필드는 넣지 마세요.',
        },
        {
          role: 'user',
          content: [
            '아래 질의를 파싱해 JSON으로 반환하세요.',
            '',
            '필드:',
            '- keywords: string[]',
            '- mustHaveIngredients: string[]',
            '- avoidIngredients: string[]',
            '- maxCookTime: number|null',
            '- servings: number|null',
            '- dietaryTags: string[]',
            "- intentType: 'recommend' | 'search' | 'cook-guide' | 'other'",
            '',
            `질의: ${message}`,
          ].join('\n'),
        },
      ],
      {
        temperature: 0,
        maxTokens: 300,
        responseFormat: { type: 'json_object' },
      },
    );

    if (!completion.content) {
      return EMPTY_INTENT;
    }

    try {
      const parsed = JSON.parse(completion.content) as Partial<StructuredRecipeIntent>;
      return {
        keywords: this.sanitizeStringArray(parsed.keywords),
        mustHaveIngredients: this.sanitizeStringArray(parsed.mustHaveIngredients),
        avoidIngredients: this.sanitizeStringArray(parsed.avoidIngredients),
        maxCookTime: this.sanitizePositiveNumber(parsed.maxCookTime),
        servings: this.sanitizePositiveNumber(parsed.servings),
        dietaryTags: this.sanitizeStringArray(parsed.dietaryTags),
        intentType: this.sanitizeIntentType(parsed.intentType),
      };
    } catch (error) {
      this.logger.warn('Intent parse failed, fallback to empty intent', error);
      return EMPTY_INTENT;
    }
  }

  private sanitizeStringArray(values: unknown): string[] {
    if (!Array.isArray(values)) {
      return [];
    }
    return values
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .slice(0, 10);
  }

  private sanitizePositiveNumber(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      return null;
    }
    return Math.floor(value);
  }

  private sanitizeIntentType(
    value: unknown,
  ): StructuredRecipeIntent['intentType'] {
    if (
      value === 'recommend' ||
      value === 'search' ||
      value === 'cook-guide' ||
      value === 'other'
    ) {
      return value;
    }
    return 'other';
  }
}
