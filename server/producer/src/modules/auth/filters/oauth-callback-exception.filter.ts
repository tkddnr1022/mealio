import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';
import { AuthService } from '../auth.service';

type ErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
  message?: string | string[];
};

@Catch()
export class OAuthCallbackExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly authService: AuthService,
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
    const path = request.path || request.originalUrl?.split('?')[0] || '';

    if (!this.isOAuthCallbackPath(path)) {
      super.catch(exception, host);
      return;
    }

    if (response.headersSent) {
      return;
    }

    const { code, message } = this.resolveErrorInfo(exception);
    const safeNext = this.authService.resolveOAuthCallbackSafeNext(
      this.getQueryParam(request, 'next'),
      this.getQueryParam(request, 'state'),
    );
    const redirectUrl = this.authService.buildOAuthFailureRedirectUrl({
      errorCode: code,
      errorMessage: message,
      next: safeNext,
    });

    response.redirect(HttpStatus.FOUND, redirectUrl);
  }

  private isOAuthCallbackPath(path: string): boolean {
    return /^\/api\/v1\/auth\/[^/]+\/callback$/.test(path);
  }

  private getQueryParam(request: Request, key: string): string | undefined {
    const value = request.query[key];
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
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

    const codeFromStatus =
      status === HttpStatus.BAD_REQUEST
        ? 'BAD_REQUEST'
        : status === HttpStatus.UNAUTHORIZED
          ? 'UNAUTHORIZED'
          : status === HttpStatus.FORBIDDEN
            ? 'FORBIDDEN'
            : status >= 500
              ? 'INTERNAL_SERVER_ERROR'
              : 'OAUTH_CALLBACK_ERROR';

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
