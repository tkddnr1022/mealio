import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { revalidateTagMock } = vi.hoisted(() => ({
  revalidateTagMock: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: revalidateTagMock,
}));

import { POST } from './route';

describe('revalidate route', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    revalidateTagMock.mockClear();
  });

  function createRequest(body: unknown): NextRequest {
    return new NextRequest('https://mealio.test/api/revalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('revalidates tags when secret matches', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret');

    const response = await POST(
      createRequest({
        secret: 'test-secret',
        tags: ['recipe:36', 'recipe-list'],
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toMatchObject({
      ok: true,
      revalidated: true,
      tags: ['recipe:36', 'recipe-list'],
    });
    expect(revalidateTagMock).toHaveBeenCalledTimes(2);
    expect(revalidateTagMock).toHaveBeenNthCalledWith(1, 'recipe:36', 'max');
    expect(revalidateTagMock).toHaveBeenNthCalledWith(2, 'recipe-list', 'max');
  });

  it('deduplicates tags before revalidation', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret');

    const response = await POST(
      createRequest({
        secret: 'test-secret',
        tags: ['recipes', 'recipes', ' recipe-list '],
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.tags).toEqual(['recipes', 'recipe-list']);
    expect(revalidateTagMock).toHaveBeenCalledTimes(2);
  });

  it('returns 401 when secret is invalid', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret');

    const response = await POST(
      createRequest({
        secret: 'wrong-secret',
        tags: ['recipes'],
      }),
    );

    expect(response.status).toBe(401);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('returns 400 when tags are invalid', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 'test-secret');

    const response = await POST(
      createRequest({
        secret: 'test-secret',
        tags: ['Invalid_Tag'],
      }),
    );

    expect(response.status).toBe(400);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it('returns 500 when REVALIDATE_SECRET is not configured', async () => {
    vi.stubEnv('REVALIDATE_SECRET', '');

    const response = await POST(
      createRequest({
        secret: 'test-secret',
        tags: ['recipes'],
      }),
    );

    expect(response.status).toBe(500);
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });
});
