import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import {
  RedisService,
  cacheKeyRateLimitApi,
  cacheKeyRateLimitInternalApi,
} from '@mealio/shared';
import { INTERNAL_API_SECRET_HEADER } from '../../constants/internal-api.constants';
import {
  INTERNAL_RATE_LIMIT_MAX_REQUESTS_PER_WINDOW,
  INTERNAL_RATE_LIMIT_WINDOW_SECONDS,
  RATE_LIMIT_MAX_REQUESTS_PER_WINDOW,
  RATE_LIMIT_WINDOW_SECONDS,
} from '../../policy/rate-limit.policy';
import { MetricsService } from '../../optimization/monitoring/metrics.service';

/**
 * API 레이트 리밋 미들웨어 (Redis 기반)
 *
 * - 공개 트래픽: IP 기준 고정 윈도우 제한.
 * - `INTERNAL_API_SECRET`이 유효한 내부 트래픽: 별도 윈도우·한도 적용.
 * - Redis INCR + EXPIRE를 사용하여 단순한 고정 윈도우 알고리즘을 구현한다.
 * - 제한 초과 시 429 Too Many Requests 응답과 함께 X-RateLimit-* 헤더를 반환한다.
 *
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    private readonly redisService: RedisService,
    private readonly metricsService: MetricsService,
    private readonly configService: ConfigService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (req.path === '/health' || req.path === '/ready') {
      return next();
    }

    const isInternalApi = this.isAuthorizedInternalApiRequest(req);
    const windowSize = isInternalApi
      ? INTERNAL_RATE_LIMIT_WINDOW_SECONDS
      : RATE_LIMIT_WINDOW_SECONDS;
    const maxRequests = isInternalApi
      ? INTERNAL_RATE_LIMIT_MAX_REQUESTS_PER_WINDOW
      : RATE_LIMIT_MAX_REQUESTS_PER_WINDOW;

    const ipIdentifier = this.getIpIdentifier(req);
    const now = Math.floor(Date.now() / 1000);
    const windowId = Math.floor(now / windowSize);

    const key = isInternalApi
      ? cacheKeyRateLimitInternalApi(windowId)
      : cacheKeyRateLimitApi(ipIdentifier, windowId);

    try {
      const client = this.redisService.getClient();

      const currentCount = await client.incr(key);
      if (currentCount === 1) {
        await client.expire(key, windowSize);
      }

      const remaining = Math.max(maxRequests - currentCount, 0);

      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());

      if (currentCount > maxRequests) {
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
      next();
    }
  }

  private getIpIdentifier(req: Request): string {
    const xff = (req.headers['x-forwarded-for'] as string | undefined) ?? '';
    const ip =
      xff.split(',')[0].trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';
    return ip.replace(/[:.]/g, '_');
  }

  private isAuthorizedInternalApiRequest(req: Request): boolean {
    const expected = this.configService
      .get<string>('INTERNAL_API_SECRET')
      ?.trim();
    if (!expected) return false;

    const headerKey = INTERNAL_API_SECRET_HEADER.toLowerCase();
    const raw = req.headers[headerKey];
    const provided = Array.isArray(raw) ? raw[0] : raw;
    if (!provided || typeof provided !== 'string') return false;

    const expectedBuf = Buffer.from(expected);
    const providedBuf = Buffer.from(provided);
    if (expectedBuf.length !== providedBuf.length) return false;

    return timingSafeEqual(expectedBuf, providedBuf);
  }
}
