import { ApiProperty } from '@nestjs/swagger';

/**
 * GET /api/v1/users/me/ingredients 응답 DTO
 */
export class UserIngredientListDto {
  @ApiProperty({
    description: '보유 재료 ID 목록',
    type: [Number],
    example: [1, 5, 12],
  })
  ingredientIds: number[];

  @ApiProperty({
    description: '즐겨찾기 재료 ID 목록',
    type: [Number],
    example: [3, 5],
  })
  favoriteIngredientIds: number[];
}
