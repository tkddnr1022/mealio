import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser } from '../types/request.types';

/**
 * 현재 인증된 사용자 정보를 추출하는 데코레이터
 * JwtAuthGuard에서 설정한 req.user (AuthUser)를 반환합니다.
 *
 * 사용 예시:
 * @Get('me')
 * getProfile(@CurrentUser() user: AuthUser) {
 *   return this.usersService.getProfile(user.id);
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
