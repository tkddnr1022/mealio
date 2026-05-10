import { ApiProperty } from '@nestjs/swagger';

/**
 * ChatbotResponse 내 추천 레시피 항목 (OpenAPI ChatbotResponse.suggestedRecipes)
 */
export class SuggestedRecipeDto {
  @ApiProperty({ description: '레시피 ID', example: 456 })
  id: number;

  @ApiProperty({ description: '레시피 제목', example: '김치볶음밥' })
  title: string;

  @ApiProperty({ description: '레시피 카테고리 ID', example: 1 })
  categoryId: number;

  @ApiProperty({ description: '레시피 카테고리 표시명', example: '한식' })
  categoryName: string;
}
