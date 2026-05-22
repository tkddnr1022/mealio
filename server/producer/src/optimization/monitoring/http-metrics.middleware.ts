import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Response, NextFunction } from 'express';
import { shouldExcludeRequestFromAppHttpObservability } from '../../modules/middleware/observability-http-paths';
import { MetricsService } from './metrics.service';
import { RequestWithCorrelationId } from '../../modules/middleware/request.types';

/**
 * HTTP 요청 메트릭 미들웨어 (duration, count, inflight).
 */
@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: RequestWithCorrelationId, res: Response, next: NextFunction): void {
    if (
      !this.metricsService.enabled ||
      shouldExcludeRequestFromAppHttpObservability(req)
    ) {
      next();
      return;
    }

    const { method, originalUrl } = req;
    const startedAt = Date.now();
    this.metricsService.incHttpInflight();

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt;
      this.metricsService.decHttpInflight();
      this.metricsService.recordHttpRequest(
        method,
        originalUrl,
        res.statusCode,
        durationMs,
      );
    });

    next();
  }
}
