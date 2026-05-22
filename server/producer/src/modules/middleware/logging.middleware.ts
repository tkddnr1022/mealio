import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { Response, NextFunction } from 'express';
import { logStructured } from '@mealio/shared';
import { RequestWithCorrelationId } from './request.types';

/**
 * HTTP 요청/응답 로깅 미들웨어
 * - 메서드, URL, 상태 코드, 처리 시간(ms), Correlation ID를 로깅한다.
 * - 실제 응답 바디는 로깅하지 않아 개인정보 유출을 방지한다.
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: RequestWithCorrelationId, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const startedAt = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const durationMs = Date.now() - startedAt;
      const fields = {
        event: 'http_request',
        service: 'producer',
        correlationId: req.correlationId,
        method,
        path: originalUrl,
        statusCode,
        durationMs,
      };

      if (statusCode >= 500) {
        logStructured(this.logger, 'error', fields);
      } else if (statusCode >= 400) {
        logStructured(this.logger, 'warn', fields);
      } else {
        logStructured(this.logger, 'log', fields);
      }
    });

    next();
  }
}
