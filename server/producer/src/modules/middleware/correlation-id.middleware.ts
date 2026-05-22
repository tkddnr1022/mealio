import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Response, NextFunction } from 'express';
import {
  CORRELATION_ID_HEADER,
  generateCorrelationId,
  runWithCorrelationId,
} from '@mealio/shared';
import { RequestWithCorrelationId } from './request.types';

/**
 * Correlation ID 미들웨어
 * - 요청 헤더의 X-Correlation-Id를 읽어오거나, 없으면 새 ID를 생성한다.
 * - 요청 컨텍스트(req)에 correlationId를 저장하고, 응답 헤더에도 X-Correlation-Id를 설정한다.
 * - 로깅·트레이싱 등에서 공통 ID로 사용한다.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: RequestWithCorrelationId, res: Response, next: NextFunction): void {
    const existingId =
      (req.headers[CORRELATION_ID_HEADER] as string | undefined) ??
      (req.headers['X-Correlation-Id'] as string | undefined);

    const correlationId =
      existingId && existingId.length > 0
        ? existingId
        : generateCorrelationId();

    req.correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);

    runWithCorrelationId(correlationId, () => {
      next();
    });
  }
}
