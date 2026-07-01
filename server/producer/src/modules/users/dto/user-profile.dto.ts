import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty({ example: 1, description: '사용자 ID' })
  id: number;

  @ApiProperty({ example: 'user@example.com', description: '이메일' })
  email: string;

  @ApiProperty({ example: '요리마스터', description: '닉네임' })
  nickname: string;

  @ApiProperty({
    example: 'kakao',
    description: '로그인 플랫폼 (google, kakao, naver 등)',
  })
  platformName: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: '가입일시' })
  createdAt: Date;

  @ApiProperty({ example: 750, description: '남은 챗봇 크레딧' })
  creditBalance: number;

  @ApiProperty({ example: 1000, description: '월간 크레딧 상한(표시용)' })
  creditMonthlyLimit: number;
}
