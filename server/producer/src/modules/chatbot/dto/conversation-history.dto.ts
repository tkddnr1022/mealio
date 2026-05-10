import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatbotMessageItemDto } from './chatbot-message-item.dto';

/**
 * GET /api/v1/chatbot/conversations/:conversationId 200 응답
 * 메시지별 추천 레시피는 요약 객체 배열(`suggestedRecipes`)로 반환
 */
export class ConversationHistoryDto {
  @ApiProperty({
    description: '대화 ID',
    example: 'conv_abc123',
  })
  conversationId: string;

  @ApiPropertyOptional({
    description: '대화 제목 (메타). 없으면 null',
    nullable: true,
    example: '저녁 메뉴 추천',
  })
  title: string | null;

  @ApiProperty({
    description: '대화 메시지 목록 (시간순, message + suggestedRecipes 형식)',
    type: [ChatbotMessageItemDto],
  })
  messages: ChatbotMessageItemDto[];
}
