import { MAX_RECOMMENDATION_ROWS } from '@mealio/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class RecommendedRecipesQueryDto {
  @ApiPropertyOptional({
    description: '반환할 추천 개수',
    default: MAX_RECOMMENDATION_ROWS,
    minimum: 1,
    maximum: MAX_RECOMMENDATION_ROWS,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_RECOMMENDATION_ROWS)
  limit?: number = MAX_RECOMMENDATION_ROWS;
}
