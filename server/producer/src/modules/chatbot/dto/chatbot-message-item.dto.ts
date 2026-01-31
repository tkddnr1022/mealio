import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 대화 히스토리 내 단일 메시지
 * GET /api/v1/chatbot/conversations/:id 응답의 messages[] 항목 (추천 레시피는 ID 배열만 반환)
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
    description: '추천 레시피 ID 목록 (assistant 메시지에서만 사용). 상세는 GET /api/v1/recipes/summaries 로 벌크 조회',
    type: [Number],
    nullable: true,
    example: [1, 2],
  })
  suggestedRecipeIds: number[] | null;

  @ApiProperty({
    description: '생성 시각',
    format: 'date-time',
    example: '2025-01-25T00:00:00.000Z',
  })
  createdAt: string;
}
