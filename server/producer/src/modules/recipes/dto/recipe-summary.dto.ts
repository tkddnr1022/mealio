import { ApiProperty } from '@nestjs/swagger';

export class RecipeSummaryDto {
  @ApiProperty({ example: 456, description: '레시피 ID' })
  id: number;

  @ApiProperty({ example: '김치볶음밥', maxLength: 100 })
  title: string;

  @ApiProperty({ example: '간단하고 맛있는 김치볶음밥', nullable: true })
  description: string | null;

  @ApiProperty({
    example: 1,
    minimum: 1,
    maximum: 5,
    description: '난이도 (1~5)',
  })
  difficulty: number;

  @ApiProperty({ example: 15, description: '조리시간 (분)' })
  cookTime: number;

  @ApiProperty({
    example: 'https://example.com/images/recipe456.jpg',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiProperty({ example: 2, description: '인분 수' })
  servings: number;

  @ApiProperty({ example: 0, description: '조회수' })
  viewCount: number;

  @ApiProperty({ example: true, description: '공개 여부' })
  isPublished: boolean;

  @ApiProperty({ example: '2025-01-10T10:30:00Z', format: 'date-time' })
  createdAt: Date;
}
