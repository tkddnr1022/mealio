import { ApiProperty } from '@nestjs/swagger';

export class IngredientCategoryDto {
  @ApiProperty({ example: 1, description: '재료 카테고리 ID' })
  id: number;

  @ApiProperty({
    example: 'VEGETABLE',
    maxLength: 50,
    description: '불변 카테고리 키',
  })
  key: string;

  @ApiProperty({ example: '채소', maxLength: 100, description: '카테고리 표시명' })
  name: string;

  @ApiProperty({ example: 1, description: '카테고리 노출 정렬 순서' })
  displayOrder: number;

  @ApiProperty({ example: true, description: '카테고리 사용 여부' })
  isActive: boolean;
}
