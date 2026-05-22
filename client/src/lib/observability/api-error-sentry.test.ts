// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api/error';

const captureException = vi.fn();
const setTag = vi.fn();
const withScope = vi.fn((cb: (scope: { setTag: typeof setTag }) => void) => {
  cb({ setTag });
});

vi.mock('@sentry/browser', () => ({
  captureException,
  withScope,
}));

vi.mock('./sentry.client', () => ({
  isClientSentryEnabled: () => true,
  setSentryCorrelationTag: vi.fn(),
}));

describe('reportApiErrorToSentry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('captures 5xx ApiError with service and correlationId tags', async () => {
    const { reportApiErrorToSentry } = await import('./api-error-sentry');
    const error = new ApiError({
      status: 500,
      message: 'Server error',
      correlationId: 'corr-abc-123',
    });

    reportApiErrorToSentry(error);

    expect(captureException).toHaveBeenCalledOnce();
    expect(captureException.mock.calls[0][1]).toMatchObject({
      tags: {
        service: 'client',
        correlationId: 'corr-abc-123',
      },
    });
  });

  it('does not capture 4xx ApiError', async () => {
    const { reportApiErrorToSentry } = await import('./api-error-sentry');
    const error = new ApiError({
      status: 404,
      message: 'Not found',
      correlationId: 'corr-404',
    });

    reportApiErrorToSentry(error);

    expect(captureException).not.toHaveBeenCalled();
  });
});
