import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateNicknameDto {
  @ApiProperty({
    description: '변경할 닉네임',
    example: '요리마스터',
    minLength: 2,
    maxLength: 20,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  nickname: string;
}
