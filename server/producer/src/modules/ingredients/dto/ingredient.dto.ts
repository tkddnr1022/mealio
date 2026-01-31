import { ApiProperty } from '@nestjs/swagger';

export class IngredientDto {
  @ApiProperty({ example: 789, description: '재료 ID' })
  id: number;

  @ApiProperty({ example: '양파', maxLength: 100, description: '재료명' })
  name: string;

  @ApiProperty({ example: 1, description: '재료 카테고리 ID' })
  category: number;
}
