import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({ example: 1, description: '페이지 번호' })
  page: number;

  @ApiProperty({ example: 50, description: '페이지 크기' })
  size: number;

  @ApiProperty({ example: 150, description: '전체 개수' })
  total: number;

  @ApiProperty({ example: 3, description: '전체 페이지 수' })
  totalPages: number;
}
