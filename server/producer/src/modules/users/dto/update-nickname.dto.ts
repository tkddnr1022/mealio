import { IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateNicknameDto {
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  nickname: string;
}
