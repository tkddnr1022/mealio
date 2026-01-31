import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class IngredientSearchQueryDto {
  @ApiProperty({ description: '검색 키워드', minLength: 1 })
  @IsString()
  @MinLength(1)
  q: string;
}
