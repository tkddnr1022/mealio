import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { isSupportedProvider } from '../constants/auth-providers';
import { OAuthProfile } from '../types/oauth.types';
import passport from 'passport';
import { RequestWithOAuthProfile } from '../types/request.types';

// TODO: state 검증 구현
@Injectable()
export class OAuthCallbackGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const next = http.getNext<NextFunction>();
    const provider = request.params['provider'] as string;
    const oauthError = request.query.error;

    if (!provider || !isSupportedProvider(provider)) {
      throw new BadRequestException({
        error: {
          code: 'BAD_REQUEST',
          message: `Unsupported provider: ${provider}`,
        },
      });
    }

    // Provider가 callback 쿼리에 이미 error를 실어 보낸 경우,
    // Passport 인증 시도를 건너뛰고 controller의 조기 분기로 넘긴다.
    if (typeof oauthError === 'string' && oauthError.trim().length > 0) {
      return true;
    }

    return new Promise<boolean>((resolve, reject) => {
      const authenticate = passport.authenticate(
        provider,
        { session: false },
        (err: unknown, user: OAuthProfile | false | null) => {
          if (err) {
            if (err instanceof Error) {
              reject(
                new UnauthorizedException({
                  error: {
                    code: 'UNAUTHORIZED',
                    message: err.message || 'OAuth authentication failed',
                  },
                }),
              );
              return;
            }
            reject(
              new UnauthorizedException({
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'OAuth authentication failed',
                },
              }),
            );
            return;
          }
          if (!user) {
            reject(
              new UnauthorizedException({
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'OAuth authentication failed',
                },
              }),
            );
            return;
          }
          (request as RequestWithOAuthProfile).user = user;
          resolve(true);
        },
      ) as (req: Request, res: Response, next: NextFunction) => void;
      authenticate(request, response, next);
    });
  }
}
