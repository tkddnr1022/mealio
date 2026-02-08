import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * PUT /api/v1/users/me/ingredients (bulk), POST (add), PUT/POST /favorites 요청 body
 */
export class IngredientIdsDto {
  @ApiProperty({
    description: '재료 ID 목록',
    type: [Number],
    example: [1, 5, 12],
  })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(0)
  @Type(() => Number)
  ingredientIds: number[];
}
