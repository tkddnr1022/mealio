import { ApiProperty } from '@nestjs/swagger';
import { RecipeSummaryDto } from './recipe-summary.dto';

export class RecipeIngredientItemDto {
  @ApiProperty({ example: 789, description: '재료 ID' })
  id: number;

  @ApiProperty({ example: '양파' })
  name: string;

  @ApiProperty({ example: 1, nullable: true, description: '수량' })
  amount: number | null;

  @ApiProperty({ example: '개', nullable: true })
  unit: string | null;

  @ApiProperty({ example: false, description: '선택 재료 여부' })
  isOptional: boolean;
}

export class RecipeInstructionStepDto {
  @ApiProperty({ example: 1, description: '단계 번호' })
  step: number;

  @ApiProperty({ example: '양파를 잘게 다진다.' })
  content: string;

  @ApiProperty({ example: 'https://example.com/step1.jpg', nullable: true })
  imageUrl?: string | null;
}

export class RecipeNutritionDto {
  @ApiProperty({ example: 220, nullable: true, description: '열량 (kcal)' })
  calories: number | null;

  @ApiProperty({ example: 3, nullable: true, description: '탄수화물 (g)' })
  carbohydrates: number | null;

  @ApiProperty({ example: 14, nullable: true, description: '단백질 (g)' })
  protein: number | null;

  @ApiProperty({ example: 17, nullable: true, description: '지방 (g)' })
  fat: number | null;

  @ApiProperty({ example: 99, nullable: true, description: '나트륨 (mg)' })
  sodium: number | null;
}

export class RecipeDetailDto extends RecipeSummaryDto {
  @ApiProperty({ example: 1, description: '레시피 카테고리 ID' })
  categoryId: number;

  @ApiProperty({ example: '한식', description: '레시피 카테고리 표시명' })
  categoryName: string;

  @ApiProperty({ example: '찌기', nullable: true, description: '조리 방법' })
  cookingMethod: string | null;

  @ApiProperty({ example: '반찬', nullable: true, description: '요리 종류' })
  dishType: string | null;

  @ApiProperty({
    type: RecipeNutritionDto,
    nullable: true,
    description: '1인분 영양 정보',
  })
  nutrition: RecipeNutritionDto | null;

  @ApiProperty({
    example: '나트륨을 줄이려면 저염 재료를 사용하세요.',
    nullable: true,
    description: '저감·건강 조리 팁',
  })
  cookingTip: string | null;

  @ApiProperty({
    example: 'foodsafety',
    nullable: true,
    description: '데이터 출처 식별자',
  })
  source: string | null;

  @ApiProperty({
    example: '28',
    nullable: true,
    description: '출처별 레시피 ID',
  })
  sourceRecipeId: string | null;

  @ApiProperty({
    type: [RecipeInstructionStepDto],
    description: '조리 단계',
  })
  instructions: RecipeInstructionStepDto[];

  @ApiProperty({
    type: [RecipeIngredientItemDto],
    description: '필요 재료 목록',
  })
  ingredients: RecipeIngredientItemDto[];
}
