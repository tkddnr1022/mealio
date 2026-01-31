import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

/**
 * POST /api/v1/chatbot/messages 요청 body
 */
export class SendMessageDto {
  @ApiProperty({
    description: '사용자 메시지',
    example: '오늘 저녁으로 뭘 해먹을까요?',
  })
  @IsString()
  @MaxLength(10000)
  message: string;

  @ApiPropertyOptional({
    description: '기존 대화 ID (선택사항)',
    example: 'conv_abc123',
  })
  @IsOptional()
  @IsString()
  @MaxLength(256)
  conversationId?: string;
}
