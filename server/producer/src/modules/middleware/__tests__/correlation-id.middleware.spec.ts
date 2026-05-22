import { CorrelationIdMiddleware } from '../correlation-id.middleware';
import { getCorrelationId } from '@mealio/shared';

describe('CorrelationIdMiddleware', () => {
  const middleware = new CorrelationIdMiddleware();

  const createMocks = (headers: Record<string, string> = {}) => {
    const req = {
      headers,
      correlationId: undefined as string | undefined,
    };
    const res = {
      setHeader: jest.fn(),
    };
    const next = jest.fn();
    return { req, res, next };
  };

  it('should generate correlation id when header is missing', () => {
    const { req, res, next } = createMocks();
    let contextDuringNext: string | undefined;
    next.mockImplementation(() => {
      contextDuringNext = getCorrelationId();
    });

    middleware.use(req as never, res as never, next);

    expect(req.correlationId).toBeDefined();
    expect(req.correlationId).toHaveLength(32);
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Correlation-Id',
      req.correlationId,
    );
    expect(next).toHaveBeenCalled();
    expect(contextDuringNext).toBe(req.correlationId);
  });

  it('should reuse incoming x-correlation-id header', () => {
    const { req, res, next } = createMocks({
      'x-correlation-id': 'abc123correlationid000000000001',
    });
    let contextDuringNext: string | undefined;
    next.mockImplementation(() => {
      contextDuringNext = getCorrelationId();
    });

    middleware.use(req as never, res as never, next);

    expect(req.correlationId).toBe('abc123correlationid000000000001');
    expect(res.setHeader).toHaveBeenCalledWith(
      'X-Correlation-Id',
      'abc123correlationid000000000001',
    );
    expect(contextDuringNext).toBe('abc123correlationid000000000001');
  });
});
