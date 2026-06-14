import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { getCorrelationId } from '@mealio/shared';
import {
  OAUTH_NEXT_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
} from '../../../constants/auth-cookie.constants';
import { AuthService } from '../auth.service';
import { SentryService } from '../../../optimization/monitoring/sentry.service';
import type { RequestWithCorrelationId } from '../../middleware/request.types';

type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
  message?: string | string[];
};

/**
 * OAuth 콜백 경로 전용 예외 필터.
 * AuthController의 callback 메서드에 @UseFilters로 적용한다.
 * 500+ 에러는 Sentry에 보고한 뒤, 프론트엔드 에러 페이지로 리다이렉트한다.
 */
@Catch()
export class OAuthCallbackExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly authService: AuthService,
    private readonly sentryService: SentryService,
    private readonly config: ConfigService,
  ) {
    super(adapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      super.catch(exception, host);
      return;
    }

    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    this.reportToSentry(exception, request);

    if (response.headersSent) {
      return;
    }

    const { code, message } = this.resolveErrorInfo(exception);
    const safeNext = this.authService.resolveOAuthCallbackSafeNext(
      this.getQueryParam(request, 'next'),
      this.getOAuthNextFromRequest(request),
    );
    const redirectUrl = this.authService.buildOAuthFailureRedirectUrl({
      errorCode: code,
      errorMessage: message,
      next: safeNext,
    });

    this.clearOAuthFlowCookies(response);
    response.redirect(HttpStatus.FOUND, redirectUrl);
  }

  private reportToSentry(exception: unknown, request: Request): void {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status < 500) {
      return;
    }

    const path = request.path || request.originalUrl?.split('?')[0] || '';
    const correlationId =
      (request as unknown as RequestWithCorrelationId).correlationId ??
      getCorrelationId() ??
      undefined;

    this.sentryService.captureException(exception, {
      path,
      correlationId,
      extra: {
        method: request.method,
        statusCode: status,
      },
    });
  }

  private getQueryParam(request: Request, key: string): string | undefined {
    const value = request.query[key];
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private getOAuthNextFromRequest(request: Request): string | undefined {
    const cookies = request.cookies as
      | Record<string, string | undefined>
      | undefined;
    const value = cookies?.[OAUTH_NEXT_COOKIE_NAME];
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private clearOAuthFlowCookies(response: Response): void {
    const options = {
      httpOnly: true as const,
      secure: this.isSecureCookie(),
      sameSite: 'lax' as const,
      path: '/',
    };
    response.clearCookie(OAUTH_STATE_COOKIE_NAME, options);
    response.clearCookie(OAUTH_NEXT_COOKIE_NAME, options);
  }

  private isSecureCookie(): boolean {
    return this.config.getOrThrow<string>('APP_ENV') !== 'development';
  }

  private resolveErrorInfo(exception: unknown): {
    code: string;
    message: string;
  } {
    const fallback = {
      code: 'OAUTH_CALLBACK_ERROR',
      message: 'OAuth 인증 처리 중 오류가 발생했습니다.',
    };

    if (!(exception instanceof HttpException)) {
      return fallback;
    }

    const status = exception.getStatus();
    const response = exception.getResponse() as ErrorBody | string;

    const statusCode = Number(status);
    let codeFromStatus = 'OAUTH_CALLBACK_ERROR';
    if (statusCode === 400) {
      codeFromStatus = 'BAD_REQUEST';
    } else if (statusCode === 401) {
      codeFromStatus = 'UNAUTHORIZED';
    } else if (statusCode === 403) {
      codeFromStatus = 'FORBIDDEN';
    } else if (statusCode >= 500) {
      codeFromStatus = 'INTERNAL_SERVER_ERROR';
    }

    if (typeof response === 'string') {
      return {
        code: codeFromStatus,
        message: response || fallback.message,
      };
    }

    const nestedCode = response.error?.code;
    const nestedMessage = response.error?.message;
    const messageCandidate = Array.isArray(response.message)
      ? response.message[0]
      : response.message;

    return {
      code: nestedCode || codeFromStatus,
      message: nestedMessage || messageCandidate || fallback.message,
    };
  }
}
