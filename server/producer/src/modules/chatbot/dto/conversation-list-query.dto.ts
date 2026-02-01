import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * GET /api/v1/chatbot/conversations 쿼리 (대화 목록 조회)
 */
export class ConversationListQueryDto {
  @ApiPropertyOptional({
    description: '한 페이지당 항목 수 (기본 20, 최대 100)',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: '다음 페이지 커서 (이전 응답의 nextCursor)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  cursor?: string;
}
