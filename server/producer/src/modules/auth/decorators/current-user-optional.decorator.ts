import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithOptionalUser } from '../types/request.types';

/**
 * 선택 인증 컨텍스트의 현재 사용자 정보를 추출하는 데코레이터.
 * OptionalJwtAuthGuard를 거친 요청에서 user가 없을 수 있다.
 */
export const CurrentUserOptional = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithOptionalUser>();
    return request.user;
  },
);
