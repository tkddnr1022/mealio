import { ApiProperty } from '@nestjs/swagger';
import { RecipeSummaryDto } from './recipe-summary.dto';

export class RecommendedRecipeItemDto {
  @ApiProperty({ type: RecipeSummaryDto })
  recipe: RecipeSummaryDto;

  @ApiProperty({ example: 1, description: '추천 순위 (1이 최상위)' })
  rank: number;

  @ApiProperty({ example: 0.92, description: '추천 점수' })
  score: number;

  @ApiProperty({
    example: '관심 재료와 조리시간 선호가 일치합니다.',
    nullable: true,
  })
  reason: string | null;

  @ApiProperty({ example: '2026-05-19T00:00:00Z', format: 'date-time' })
  calculatedAt: Date;
}
