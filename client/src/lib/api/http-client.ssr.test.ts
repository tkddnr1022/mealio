import { describe, expect, it, vi } from 'vitest';

import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { createHttpClient } from './http-client';

describe('HttpClient SSR auth behavior', () => {
  it('does not attempt token refresh on SSR 401 response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 401,
          message: 'Unauthorized',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = createHttpClient({ baseUrl: 'https://api.mealio.test' });

    await expect(client.get(API_ENDPOINTS.users.me)).rejects.toMatchObject({
      status: 401,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://api.mealio.test/api/v1/users/me',
    );
  });

  it('passes Next.js Data Cache options to fetch on SSR', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = createHttpClient({ baseUrl: 'https://api.mealio.test' });

    await client.get(API_ENDPOINTS.recipes.categories, {
      next: { revalidate: 300 },
      cache: 'force-cache',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.mealio.test/api/v1/recipes/categories',
      expect.objectContaining({
        next: { revalidate: 300 },
        cache: 'force-cache',
      }),
    );
  });
});
