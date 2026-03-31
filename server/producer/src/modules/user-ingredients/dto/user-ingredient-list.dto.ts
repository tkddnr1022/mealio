import { ApiProperty } from '@nestjs/swagger';
import { UserIngredientEntryDto } from './user-ingredient-entry.dto';

/**
 * GET /api/v1/users/me/ingredients 응답 DTO
 */
export class UserIngredientListDto {
  @ApiProperty({
    description: '보유 재료 목록 (id, name, categoryId)',
    type: [UserIngredientEntryDto],
  })
  ingredients: UserIngredientEntryDto[];

  @ApiProperty({
    description: '즐겨찾기 재료 목록 (id, name, categoryId)',
    type: [UserIngredientEntryDto],
  })
  favoriteIngredients: UserIngredientEntryDto[];
}
