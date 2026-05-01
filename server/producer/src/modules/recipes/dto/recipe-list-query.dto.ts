import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsArray, Min, Max, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  DEFAULT_RECIPE_SORT,
  RECIPE_SORT_KEYS,
  type RecipeListOrder,
} from '../policies/recipe-sort.policy';

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

  @ApiPropertyOptional({ description: '최소 조리시간 (분)', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cookTimeMin?: number;

  @ApiPropertyOptional({ description: '최대 조리시간 (분)', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cookTimeMax?: number;

  @ApiPropertyOptional({
    description: '정렬 기준',
    enum: RECIPE_SORT_KEYS,
    default: DEFAULT_RECIPE_SORT,
  })
  @IsOptional()
  @IsIn(RECIPE_SORT_KEYS)
  sort?: RecipeListOrder = DEFAULT_RECIPE_SORT;
}
