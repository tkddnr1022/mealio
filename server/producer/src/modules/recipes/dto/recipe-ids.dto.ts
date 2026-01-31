import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * POST /api/v1/recipes/summaries 요청 body (레시피 ID 배열)
 */
export class RecipeIdsDto {
  @ApiProperty({
    description: '레시피 ID 목록 (최대 100개)',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMaxSize(100)
  @Type(() => Number)
  ids: number[];
}
