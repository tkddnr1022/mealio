import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 대화 목록 단일 항목 (OpenAPI ConversationList.items 항목)
 */
export class ConversationListItemDto {
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
    description:
      '대화 메타 최종 갱신 시각',
    format: 'date-time',
    example: '2025-01-25T12:00:00.000Z',
  })
  updatedAt: string;
}
