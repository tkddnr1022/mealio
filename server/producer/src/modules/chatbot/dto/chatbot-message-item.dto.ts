import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SuggestedRecipeDto } from './suggested-recipe.dto';

/**
 * 대화 히스토리 내 단일 메시지
 * GET /api/v1/chatbot/conversations/:id 응답의 messages[] 항목
 */
export class ChatbotMessageItemDto {
  @ApiProperty({
    description: '역할',
    enum: ['user', 'assistant', 'system'],
  })
  role: 'user' | 'assistant' | 'system';

  @ApiProperty({ description: '메시지 본문' })
  message: string;

  @ApiPropertyOptional({
    description:
      '추천 레시피 요약 목록 (assistant 메시지·저장된 context.suggestedRecipes가 있을 때만)',
    type: [SuggestedRecipeDto],
    nullable: true,
  })
  suggestedRecipes: SuggestedRecipeDto[] | null;

  @ApiProperty({
    description: '생성 시각',
    format: 'date-time',
    example: '2025-01-25T00:00:00.000Z',
  })
  createdAt: string;
}
