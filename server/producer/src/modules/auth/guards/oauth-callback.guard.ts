import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { OAUTH_STATE_COOKIE_NAME } from '../../../constants/auth-cookie.constants';
import { isSupportedProvider } from '../constants/auth-providers';
import { OAuthProfile } from '../types/oauth.types';
import passport from 'passport';
import { RequestWithOAuthProfile } from '../types/request.types';

@Injectable()
export class OAuthCallbackGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

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

    const queryState = this.getQueryParam(request, 'state');
    const cookies = request.cookies as
      | Record<string, string | undefined>
      | undefined;
    const cookieState = cookies?.[OAUTH_STATE_COOKIE_NAME];

    this.assertOAuthStateValid(queryState, cookieState);
    this.clearOAuthStateCookie(response);

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

  private getQueryParam(request: Request, key: string): string | undefined {
    const value = request.query[key];
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private clearOAuthStateCookie(response: Response): void {
    response.clearCookie(OAUTH_STATE_COOKIE_NAME, {
      httpOnly: true,
      secure: this.isSecureCookie(),
      sameSite: 'lax',
      path: '/',
    });
  }

  /**
   * 콜백 query `state`와 로그인 진입 시 저장한 쿠키 state를 대조한다.
   * 누락·형식 오류·불일치 시 UnauthorizedException.
   */
  private assertOAuthStateValid(
    queryState: string | null | undefined,
    cookieState: string | null | undefined,
  ): void {
    const query = this.normalizeOAuthStateValue(queryState);
    const stored = this.normalizeOAuthStateValue(cookieState);

    if (!query || !stored) {
      throw new UnauthorizedException({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid OAuth state',
        },
      });
    }

    if (!this.secureEquals(query, stored)) {
      throw new UnauthorizedException({
        error: {
          code: 'UNAUTHORIZED',
          message: 'OAuth state mismatch',
        },
      });
    }
  }

  /** OAuth state 값 정규화(64 hex). 유효하지 않으면 null. */
  private normalizeOAuthStateValue(
    value: string | null | undefined,
  ): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    if (trimmed.length !== 64 || !/^[0-9a-f]+$/.test(trimmed)) {
      return null;
    }
    return trimmed;
  }

  private secureEquals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }
    return timingSafeEqual(leftBuffer, rightBuffer);
  }

  private isSecureCookie(): boolean {
    return this.config.getOrThrow<string>('NODE_ENV') !== 'development';
  }
}
