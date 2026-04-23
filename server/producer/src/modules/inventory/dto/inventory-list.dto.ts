import { ApiProperty } from '@nestjs/swagger';
import { InventoryEntryDto } from './inventory-entry.dto';

/**
 * GET /api/v1/users/me/inventory/ingredients 응답 DTO
 */
export class InventoryListDto {
  @ApiProperty({
    description: '보유 재료 목록 (id, name, categoryId)',
    type: [InventoryEntryDto],
  })
  ownedIngredients: InventoryEntryDto[];

  @ApiProperty({
    description: '관심 재료 목록 (id, name, categoryId)',
    type: [InventoryEntryDto],
  })
  favoriteIngredients: InventoryEntryDto[];
}
