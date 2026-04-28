import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsArray, Min, Max, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';

function toNumberArray(value: unknown): number[] | undefined {
  if (value == null) return undefined;
  const arr = Array.isArray(value) ? value : [value];
  return arr
    .map((v) => (typeof v === 'string' ? parseInt(v, 10) : Number(v)))
    .filter((n) => !Number.isNaN(n));
}

export class RecipeListQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number = 20;

  @ApiPropertyOptional({
    description: '난이도 필터 (1~5)',
    type: [Number],
    example: [1, 2],
  })
  @IsOptional()
  @Transform(({ value }) => toNumberArray(value))
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(5, { each: true })
  difficulty?: number[];

  @ApiPropertyOptional({ description: '최대 조리시간 (분)', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cookTime?: number;

  @ApiPropertyOptional({
    description: '정렬 기준',
    enum: ['latest', 'cookTime', 'difficulty', 'viewCount', 'likeCount'],
    default: 'latest',
  })
  @IsOptional()
  @IsIn(['latest', 'cookTime', 'difficulty', 'viewCount', 'likeCount'])
  sort?: 'latest' | 'cookTime' | 'difficulty' | 'viewCount' | 'likeCount' =
    'latest';
}
