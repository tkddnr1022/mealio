import { EventEmitter } from 'events';
import { LoggingMiddleware } from '../logging.middleware';

describe('LoggingMiddleware', () => {
  const middleware = new LoggingMiddleware();

  it('should emit structured JSON log on response finish', () => {
    const logSpy = jest.spyOn(middleware['logger'], 'log');
    const res = new EventEmitter() as EventEmitter & {
      statusCode: number;
      on: EventEmitter['on'];
    };
    res.statusCode = 200;

    const req = {
      method: 'GET',
      originalUrl: '/api/v1/recipes',
      correlationId: 'test-correlation-id',
    };

    middleware.use(req as never, res as never, jest.fn());
    res.emit('finish');

    expect(logSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(logSpy.mock.calls[0][0] as string);
    expect(payload).toMatchObject({
      event: 'http_request',
      service: 'producer',
      correlationId: 'test-correlation-id',
      method: 'GET',
      path: '/api/v1/recipes',
      statusCode: 200,
    });
    expect(typeof payload.durationMs).toBe('number');

    logSpy.mockRestore();
  });

  it.each(['/metrics', '/health', '/ready'])(
    'should skip logging for %s',
    (path) => {
      const logSpy = jest.spyOn(middleware['logger'], 'log');
      const next = jest.fn();
      const res = new EventEmitter() as EventEmitter & {
        statusCode: number;
        on: EventEmitter['on'];
      };
      res.statusCode = 200;

      middleware.use(
        {
          method: 'GET',
          path: '/',
          originalUrl: path,
          url: path,
        } as never,
        res as never,
        next,
      );
      res.emit('finish');

      expect(next).toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
      logSpy.mockRestore();
    },
  );
});
