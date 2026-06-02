import { ApiProperty } from '@nestjs/swagger';

export class UserActivityItemDto {
  @ApiProperty({ example: '682d0f4bbad3dd2f851f6d80' })
  id: string;

  @ApiProperty({ example: 'recipe.view' })
  type: string;

  @ApiProperty({ example: '2026-06-02T08:30:00.000Z' })
  occurredAt: string;
}
