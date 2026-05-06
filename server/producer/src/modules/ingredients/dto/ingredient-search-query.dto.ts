import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class IngredientSearchQueryDto {
  @ApiPropertyOptional({
    description: '검색 키워드 (생략 시 이름 필터 없음)',
    minLength: 1,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const s = String(value).trim();
    return s.length === 0 ? undefined : s;
  })
  @IsString()
  @MinLength(1)
  q?: string;

  @ApiPropertyOptional({ description: '재료 카테고리 ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number = 50;
}
