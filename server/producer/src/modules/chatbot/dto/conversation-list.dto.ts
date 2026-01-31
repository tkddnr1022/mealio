import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationListItemDto } from './conversation-list-item.dto';

/**
 * GET /api/v1/chatbot/conversations 200 응답 (OpenAPI ConversationList)
 */
export class ConversationListDto {
  @ApiProperty({
    description: '대화 목록 (최신 대화 순)',
    type: [ConversationListItemDto],
  })
  items: ConversationListItemDto[];

  @ApiPropertyOptional({
    description: '다음 페이지가 있으면 값이 있으며, 다음 요청의 cursor 파라미터로 사용',
    nullable: true,
  })
  nextCursor: string | null;
}
