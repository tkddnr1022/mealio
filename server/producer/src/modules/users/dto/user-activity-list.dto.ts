import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserActivityItemDto } from './user-activity-item.dto';

export class UserActivityListDto {
  @ApiProperty({ type: [UserActivityItemDto] })
  items: UserActivityItemDto[];

  @ApiPropertyOptional({
    description: '다음 페이지 커서 (없으면 null)',
    nullable: true,
    example: '2026-06-01T13:20:10.000Z',
  })
  nextCursor: string | null;
}
