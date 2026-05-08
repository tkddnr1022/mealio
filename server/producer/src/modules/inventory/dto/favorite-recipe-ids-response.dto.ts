import { ApiProperty } from '@nestjs/swagger';

/**
 * GET /api/v1/users/me/favorite-recipes/ids 응답 DTO
 */
export class FavoriteRecipeIdsResponseDto {
  @ApiProperty({
    description: '관심 레시피 ID 목록 (Mongo inventory recipes.favoriteIds 순서 유지)',
    type: [Number],
    example: [101, 202],
  })
  favoriteRecipeIds: number[];
}
