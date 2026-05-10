import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 챗봇이 제안하는 레시피 요약 (Mongo `SuggestedRecipeSummary`·OpenAPI `SuggestedRecipeSummary`와 동일 필드)
 * — ChatbotResponse.suggestedRecipes, 대화 히스토리 메시지의 suggestedRecipes에 사용
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

  @ApiPropertyOptional({
    description: '대표 이미지 URL',
    nullable: true,
    example: 'https://cdn.example.com/recipes/456.jpg',
  })
  imageUrl: string | null;
}
