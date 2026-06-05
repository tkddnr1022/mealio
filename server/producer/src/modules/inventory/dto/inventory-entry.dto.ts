import { ApiProperty } from '@nestjs/swagger';

/**
 * 내 재료함 항목 (GET /api/v1/users/me/ingredients)
 */
export class InventoryEntryDto {
  @ApiProperty({ example: 1, description: '재료 ID' })
  id: number;

  @ApiProperty({ example: '양파', description: '재료명' })
  name: string;

  @ApiProperty({
    example: 1,
    description: '재료 카테고리 ID (RDB에 없는 ID는 null)',
    nullable: true,
    type: Number,
  })
  categoryId: number | null;

  @ApiProperty({
    example: '채소',
    description: '재료 카테고리명 (RDB에 없는 ID는 null)',
    nullable: true,
    type: String,
  })
  categoryName: string | null;
}
