import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

/**
 * Correlation ID 미들웨어
 * - 요청 헤더의 X-Correlation-Id를 읽어오거나, 없으면 새 ID를 생성한다.
 * - 요청 컨텍스트(req)에 correlationId를 저장하고, 응답 헤더에도 X-Correlation-Id를 설정한다.
 * - 로깅·트레이싱 등에서 공통 ID로 사용한다.
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private static readonly HEADER_NAME = 'x-correlation-id';

  use(
    req: Request & { correlationId?: string },
    res: Response,
    next: NextFunction,
  ): void {
    const existingId =
      (req.headers[CorrelationIdMiddleware.HEADER_NAME] as
        | string
        | undefined) ?? undefined;

    const correlationId =
      existingId && existingId.length > 0
        ? existingId
        : randomUUID().replace(/-/g, '');

    req.correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);

    next();
  }
}
