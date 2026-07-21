import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    cache: <A extends unknown[], R>(fn: (...args: A) => R) => {
      let hit = false;
      let value: R;
      return (...args: A): R => {
        if (!hit) {
          value = fn(...args);
          hit = true;
        }
        return value;
      };
    },
  };
});

import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { INTERNAL_API_SECRET_HEADER } from '@/lib/constants/internal-api.constants';
import { createHttpClient } from './http-client';
import { serverFetchRequestInterceptor } from './server/server-fetch.interceptor';

function jsonOkResponse(body: unknown = { data: [] }): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('HttpClient SSR auth behavior', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

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
    const fetchMock = vi.fn().mockResolvedValue(jsonOkResponse());
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

  it('adds X-Internal-Api-Secret header on SSR when INTERNAL_API_SECRET is set', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonOkResponse());
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('INTERNAL_API_SECRET', 'local-internal-secret');

    const client = createHttpClient({
      baseUrl: 'https://api.mealio.test',
      requestInterceptors: [serverFetchRequestInterceptor],
    });

    await client.get(API_ENDPOINTS.recipes.categories);

    const requestHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(requestHeaders.get(INTERNAL_API_SECRET_HEADER)).toBe(
      'local-internal-secret',
    );
  });

  it('reuses the same X-Correlation-Id across SSR calls in one scope', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() => Promise.resolve(jsonOkResponse()));
    vi.stubGlobal('fetch', fetchMock);

    const client = createHttpClient({ baseUrl: 'https://api.mealio.test' });

    await client.get(API_ENDPOINTS.recipes.categories);
    await client.get(API_ENDPOINTS.recipes.list);

    const firstHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    const secondHeaders = fetchMock.mock.calls[1]?.[1]?.headers as Headers;
    const firstId = firstHeaders.get('X-Correlation-Id');
    const secondId = secondHeaders.get('X-Correlation-Id');

    expect(firstId).toBeTruthy();
    expect(firstId).toBe(secondId);
  });

  it('keeps an existing X-Correlation-Id header instead of regenerating', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonOkResponse());
    vi.stubGlobal('fetch', fetchMock);

    const client = createHttpClient({ baseUrl: 'https://api.mealio.test' });

    await client.get(API_ENDPOINTS.recipes.categories, {
      headers: { 'X-Correlation-Id': 'inbound-corr-id' },
    });

    const requestHeaders = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(requestHeaders.get('X-Correlation-Id')).toBe('inbound-corr-id');
  });
});
