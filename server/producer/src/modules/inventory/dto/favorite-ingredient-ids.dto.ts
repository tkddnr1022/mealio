import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * PUT/POST /api/v1/users/me/inventory/ingredients/favorites 요청 body
 */
export class FavoriteIngredientIdsDto {
  @ApiProperty({
    description: '관심 재료 ID 목록',
    type: [Number],
    example: [1, 5, 12],
  })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(0)
  @Type(() => Number)
  favoriteIngredientIds: number[];
}
