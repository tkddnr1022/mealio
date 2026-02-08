import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { isSupportedProvider } from '../constants/auth-providers';
import { OAuthProfile } from '../types/oauth.types';
import passport from 'passport';

@Injectable()
export class OAuthCallbackGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse();
    const next = http.getNext();
    const provider = request.params['provider'] as string;

    if (!provider || !isSupportedProvider(provider)) {
      throw new UnauthorizedException(`Unsupported provider: ${provider}`);
    }

    return new Promise<boolean>((resolve, reject) => {
      passport.authenticate(
        provider,
        { session: false },
        (err: unknown, user: OAuthProfile | false | null) => {
          if (err) {
            reject(err);
            return;
          }
          if (!user) {
            reject(new UnauthorizedException('OAuth authentication failed'));
            return;
          }
          (request as Request & { user: OAuthProfile }).user = user;
          resolve(true);
        },
      )(request, response, next);
    });
  }
}
