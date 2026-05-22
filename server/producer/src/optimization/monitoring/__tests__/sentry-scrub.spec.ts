import { scrubObject, scrubSentryEvent } from '@mealio/shared';

describe('sentry-scrub (shared)', () => {
  it('masks sensitive keys in nested objects', () => {
    const result = scrubObject({
      user: { id: '1' },
      access_token: 'secret',
    }) as Record<string, unknown>;
    expect(result.access_token).toBe('[Filtered]');
    expect((result.user as Record<string, unknown>).id).toBe('1');
  });

  it('strips authorization headers from Sentry events', () => {
    const scrubbed = scrubSentryEvent({
      request: { headers: { Authorization: 'Bearer x', Accept: 'json' } },
    });
    const headers = (
      scrubbed.request as { headers?: Record<string, string> }
    ).headers;
    expect(headers?.Authorization).toBe('[Filtered]');
    expect(headers?.Accept).toBe('json');
  });
});
