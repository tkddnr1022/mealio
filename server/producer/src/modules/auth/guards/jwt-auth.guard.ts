import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RequestWithUser, JwtPayload } from '../types/request.types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    const cookies = request.cookies as
      | Record<string, string | undefined>
      | undefined;
    const accessToken = cookies?.accessToken;
    if (!accessToken) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const decoded = this.jwt.verify<JwtPayload>(accessToken);
      const id = parseInt(decoded.sub, 10);
      if (Number.isNaN(id)) {
        throw new UnauthorizedException('Invalid token');
      }
      request.user = { id };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
