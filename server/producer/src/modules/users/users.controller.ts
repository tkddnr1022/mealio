import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserProfileDto } from './dto/user-profile.dto';
import { UpdateNicknameDto } from './dto/update-nickname.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/request.types';

@ApiTags('User')
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    type: UserProfileDto,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  async getProfile(@CurrentUser() user: AuthUser): Promise<UserProfileDto> {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me/nickname')
  @ApiOperation({ summary: '닉네임 수정' })
  @ApiResponse({
    status: 200,
    description: '닉네임 수정 성공',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'integer', format: 'int64' },
        nickname: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 500, description: '서버 내부 오류' })
  async updateNickname(
    @CurrentUser() user: AuthUser,
    @Body() updateNicknameDto: UpdateNicknameDto,
  ): Promise<{ id: number; nickname: string }> {
    return this.usersService.updateNickname(user.id, updateNicknameDto);
  }
}
