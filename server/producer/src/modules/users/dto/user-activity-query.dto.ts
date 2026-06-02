import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserActivityQueryDto {
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
    description: '다음 페이지 커서 (이전 응답의 nextCursor, ISO occurredAt)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  cursor?: string;

  @ApiPropertyOptional({
    description: '이벤트 타입 필터',
    type: [String],
    example: ['recipe.view', 'chatbot.message'],
  })
  @IsOptional()
  types?: string[];
}
