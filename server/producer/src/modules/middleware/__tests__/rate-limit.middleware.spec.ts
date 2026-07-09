import { HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RedisService } from '@mealio/shared';
import { INTERNAL_API_SECRET_HEADER } from '../../../constants/internal-api.constants';
import {
  INTERNAL_RATE_LIMIT_MAX_REQUESTS_PER_WINDOW,
  RATE_LIMIT_MAX_REQUESTS_PER_WINDOW,
} from '../../../policy/rate-limit.policy';
import { MetricsService } from '../../../optimization/monitoring/metrics.service';
import { RateLimitMiddleware } from '../rate-limit.middleware';

describe('RateLimitMiddleware', () => {
  const createRedisMock = () => {
    const client = {
      incr: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
    };
    const redisService = {
      getClient: jest.fn(() => client),
    } as unknown as RedisService;
    return { redisService, client };
  };

  const createMocks = (headers: Record<string, string> = {}) => {
    const req = {
      path: '/api/v1/recipes',
      headers,
      ip: '127.0.0.1',
      socket: { remoteAddress: '127.0.0.1' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
    };
    const next = jest.fn();
    return { req, res, next };
  };

  const createMiddleware = (
    redisService: RedisService,
    internalApiSecret?: string,
  ) => {
    const configService = {
      get: jest.fn((key: string) =>
        key === 'INTERNAL_API_SECRET' ? internalApiSecret : undefined,
      ),
    } as unknown as ConfigService;
    const metricsService = {
      recordRateLimitBlocked: jest.fn(),
    } as unknown as MetricsService;

    return new RateLimitMiddleware(redisService, metricsService, configService);
  };

  it('applies internal rate limit bucket for authorized internal API requests', async () => {
    const { redisService, client } = createRedisMock();
    client.incr.mockResolvedValue(1);
    const middleware = createMiddleware(redisService, 'internal-secret');
    const { req, res, next } = createMocks({
      [INTERNAL_API_SECRET_HEADER.toLowerCase()]: 'internal-secret',
    });

    await middleware.use(req as never, res as never, next);

    expect(client.incr).toHaveBeenCalledWith(
      expect.stringMatching(/^rate_limit:api:internal:\d+$/),
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Limit',
      INTERNAL_RATE_LIMIT_MAX_REQUESTS_PER_WINDOW.toString(),
    );
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('applies public rate limit when internal API secret header mismatches', async () => {
    const { redisService, client } = createRedisMock();
    client.incr.mockResolvedValue(101);
    client.ttl.mockResolvedValue(30);
    const middleware = createMiddleware(redisService, 'internal-secret');
    const { req, res, next } = createMocks({
      'x-internal-api-secret': 'wrong-secret',
    });

    await middleware.use(req as never, res as never, next);

    expect(client.incr).toHaveBeenCalledWith(
      expect.stringContaining('rate_limit:api:127_0_0_1:'),
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Limit',
      RATE_LIMIT_MAX_REQUESTS_PER_WINDOW.toString(),
    );
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
  });

  it('applies public rate limit when internal secret is absent in runtime config', async () => {
    const { redisService, client } = createRedisMock();
    client.incr.mockResolvedValue(1);
    const middleware = createMiddleware(redisService, undefined);
    const { req, res, next } = createMocks({
      [INTERNAL_API_SECRET_HEADER.toLowerCase()]: 'internal-secret',
    });

    await middleware.use(req as never, res as never, next);

    expect(client.incr).toHaveBeenCalledWith(
      expect.stringContaining('rate_limit:api:127_0_0_1:'),
    );
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-RateLimit-Limit',
      RATE_LIMIT_MAX_REQUESTS_PER_WINDOW.toString(),
    );
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
