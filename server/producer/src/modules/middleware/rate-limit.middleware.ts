import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { RedisService, cacheKeyRateLimitApi } from '@mealio/shared';
import {
  RATE_LIMIT_MAX_REQUESTS_PER_WINDOW,
  RATE_LIMIT_WINDOW_SECONDS,
} from '../../policy/rate-limit.policy';
import { MetricsService } from '../../optimization/monitoring/metrics.service';

/**
 * API 레이트 리밋 미들웨어 (Redis 기반)
 *
 * - IP 기준 분당 요청 수를 제한한다.
 * - Redis INCR + EXPIRE를 사용하여 단순한 고정 윈도우 알고리즘을 구현한다.
 * - 제한 초과 시 429 Too Many Requests 응답과 함께 X-RateLimit-* 헤더를 반환한다.
 *
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    private readonly redisService: RedisService,
    private readonly metricsService: MetricsService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // 헬스체크 엔드포인트는 제한 대상에서 제외
    if (req.path === '/health' || req.path === '/ready') {
      return next();
    }

    const identifier = this.getIdentifier(req);
    const now = Math.floor(Date.now() / 1000);
    const windowSize = RATE_LIMIT_WINDOW_SECONDS;
    const windowId = Math.floor(now / windowSize);

    const key = cacheKeyRateLimitApi(identifier, windowId);

    try {
      const client = this.redisService.getClient();

      const currentCount = await client.incr(key);
      if (currentCount === 1) {
        // 첫 요청이면 TTL 설정
        await client.expire(key, windowSize);
      }

      const remaining = Math.max(
        RATE_LIMIT_MAX_REQUESTS_PER_WINDOW - currentCount,
        0,
      );

      // 기본 RateLimit 헤더 설정
      res.setHeader(
        'X-RateLimit-Limit',
        RATE_LIMIT_MAX_REQUESTS_PER_WINDOW.toString(),
      );
      res.setHeader('X-RateLimit-Remaining', remaining.toString());

      if (currentCount > RATE_LIMIT_MAX_REQUESTS_PER_WINDOW) {
        const ttl = await client.ttl(key);
        if (ttl > 0) {
          res.setHeader('Retry-After', ttl.toString());
        }

        this.metricsService.recordRateLimitBlocked();

        res.status(HttpStatus.TOO_MANY_REQUESTS).json({
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
          error: 'Too Many Requests',
        });
        return;
      }

      next();
    } catch {
      // 레이트 리미터 장애 시에는 서비스 가용성을 우선하여 통과시키고, 로깅은 RedisService에서 처리
      next();
    }
  }

  /**
   * 레이트 리밋 식별자
   * - 기본: IP 주소 (프록시 환경에서는 X-Forwarded-For 우선)
   */
  private getIdentifier(req: Request): string {
    const xff = (req.headers['x-forwarded-for'] as string | undefined) ?? '';
    const ip =
      xff.split(',')[0].trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';
    return ip.replace(/[:.]/g, '_');
  }
}
