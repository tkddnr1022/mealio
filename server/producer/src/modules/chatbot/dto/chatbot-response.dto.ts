import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SuggestedRecipeDto } from './suggested-recipe.dto';

/**
 * POST /api/v1/chatbot/messages 200 응답 (OpenAPI ChatbotResponse)
 */
export class ChatbotResponseDto {
  @ApiProperty({
    description: '대화 ID',
    example: 'conv_abc123',
  })
  conversationId: string;

  @ApiProperty({
    description: '챗봇 응답 메시지',
    example:
      '김치볶음밥은 어떠세요? 집에 있는 재료로 15분이면 완성할 수 있습니다.',
  })
  message: string;

  @ApiPropertyOptional({
    description: '추천 레시피 목록',
    type: [SuggestedRecipeDto],
    nullable: true,
  })
  suggestedRecipes: SuggestedRecipeDto[] | null;
}
