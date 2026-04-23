import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * PUT/POST /api/v1/users/me/inventory/ingredients/owned 요청 body
 */
export class OwnedIngredientIdsDto {
  @ApiProperty({
    description: '보유 재료 ID 목록',
    type: [Number],
    example: [1, 5, 12],
  })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(0)
  @Type(() => Number)
  ownedIngredientIds: number[];
}
