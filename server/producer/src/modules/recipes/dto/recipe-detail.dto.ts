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

export class RecipeDetailDto extends RecipeSummaryDto {
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
