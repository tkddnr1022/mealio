import { describe, expect, it } from 'vitest';

import { GET } from './route';

describe('health route', () => {
  it('returns ok with no-store cache', async () => {
    const response = GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({ ok: true });
    expect(typeof payload.now).toBe('number');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
});
