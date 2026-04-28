import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * POST /api/v1/users/me/inventory/recipes/favorites 요청 body
 */
export class FavoriteRecipeIdsDto {
  @ApiProperty({
    description: '관심 레시피 ID 목록',
    type: [Number],
    example: [101, 202],
  })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(0)
  @Type(() => Number)
  favoriteRecipeIds: number[];
}
