import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { Request } from 'express';
import { getCorrelationId } from '@mealio/shared';
import { SentryService } from './sentry.service';
import type { RequestWithCorrelationId } from '../../modules/middleware/request.types';

/**
 * 처리되지 않은 HTTP 예외를 Sentry에 보고한 뒤 기본 Nest 응답으로 위임한다.
 * OAuth 콜백 전용 필터보다 낮은 우선순위로 등록한다(콜백 경로는 OAuth 필터가 처리).
 */
@Catch()
export class GlobalSentryExceptionFilter
  extends BaseExceptionFilter
  implements ExceptionFilter
{
  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly sentryService: SentryService,
  ) {
    super(adapterHost.httpAdapter);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() === 'http' && this.sentryService.isEnabled()) {
      this.reportToSentry(exception, host);
    }
    super.catch(exception, host);
  }

  private reportToSentry(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<RequestWithCorrelationId & Request>();
    const path = request.path || request.originalUrl?.split('?')[0] || '';
    const correlationId =
      request.correlationId ?? getCorrelationId() ?? undefined;
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status < 500) {
      return;
    }

    this.sentryService.captureException(exception, {
      path,
      correlationId,
      extra: {
        method: request.method,
        statusCode: status,
      },
    });
  }
}
