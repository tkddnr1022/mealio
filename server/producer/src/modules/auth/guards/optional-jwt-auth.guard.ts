import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RequestWithOptionalUser, JwtPayload } from '../types/request.types';

/**
 * 선택 인증 가드.
 * - accessToken이 없으면 인증 없이 통과
 * - accessToken이 유효하면 req.user를 주입하고 통과
 * - accessToken이 무효/만료면 401 반환
 */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithOptionalUser>();
    const accessToken = request.cookies?.accessToken;

    if (!accessToken) {
      return true;
    }

    try {
      const decoded = this.jwt.verify<JwtPayload>(accessToken);
      const id = parseInt(decoded.sub, 10);

      if (!Number.isNaN(id)) {
        request.user = { id };
        return true;
      }

      throw new UnauthorizedException('Invalid token');
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
