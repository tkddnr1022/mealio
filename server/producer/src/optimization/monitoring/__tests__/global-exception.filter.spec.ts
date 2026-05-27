import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { GlobalSentryExceptionFilter } from '../global-exception.filter';
import { SentryService } from '../sentry.service';
import * as sharedSentry from '@mealio/shared';

jest.mock('@mealio/shared', () => {
  const actual = jest.requireActual('@mealio/shared');
  return {
    ...actual,
    captureSentryException: jest.fn(() => 'event-id'),
    getCorrelationId: jest.fn(() => 'corr-123'),
  };
});

describe('GlobalSentryExceptionFilter', () => {
  const captureMock = sharedSentry.captureSentryException as jest.Mock;

  const sentryService = {
    isEnabled: () => true,
    captureException: jest.fn((error: unknown, ctx?: { path?: string }) => {
      return captureMock(error, 'producer', {
        correlationId: ctx?.correlationId,
        feature: undefined,
      });
    }),
  } as unknown as SentryService;

  const httpAdapter = {
    reply: jest.fn(),
    getRequestMethod: jest.fn().mockReturnValue('GET'),
    getRequestUrl: jest.fn().mockReturnValue('/api/v1/recipes'),
    isHeadersSent: jest.fn().mockReturnValue(false),
  };

  const filter = new GlobalSentryExceptionFilter(
    { httpAdapter } as HttpAdapterHost,
    sentryService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createHost(path: string, correlationId?: string): ArgumentsHost {
    const req = {
      method: 'GET',
      path,
      originalUrl: path,
      correlationId,
    };
    const res = { headersSent: false };
    return {
      getType: () => 'http',
      getArgByIndex: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as unknown as ArgumentsHost;
  }

  it('reports 5xx to Sentry with correlation id', () => {
    const host = createHost('/api/v1/recipes', 'corr-abc');
    filter.catch(
      new HttpException('fail', HttpStatus.INTERNAL_SERVER_ERROR),
      host,
    );

    expect(sentryService.captureException).toHaveBeenCalledWith(
      expect.any(HttpException),
      expect.objectContaining({
        path: '/api/v1/recipes',
        correlationId: 'corr-abc',
      }),
    );
  });

  it('does not report 4xx to Sentry', () => {
    const host = createHost('/api/v1/recipes');
    filter.catch(new HttpException('bad', HttpStatus.BAD_REQUEST), host);

    expect(sentryService.captureException).not.toHaveBeenCalled();
  });
});
