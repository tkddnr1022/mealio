import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * PUT /api/v1/users/me/ingredients (유저 재료 업데이트), POST (재료 추가), PUT/POST /favorites (즐겨찾기 재료 업데이트) 요청 body
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
