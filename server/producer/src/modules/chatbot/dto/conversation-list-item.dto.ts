import { ApiProperty } from '@nestjs/swagger';

/**
 * 대화 목록 단일 항목 (OpenAPI ConversationList.items 항목)
 */
export class ConversationListItemDto {
  @ApiProperty({
    description: '대화 ID',
    example: 'conv_abc123',
  })
  conversationId: string;

  @ApiProperty({
    description: '해당 대화의 마지막 메시지 시각',
    format: 'date-time',
    example: '2025-01-25T12:00:00.000Z',
  })
  lastMessageAt: string;
}
