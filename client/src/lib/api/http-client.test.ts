// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { API_ENDPOINTS } from '@/lib/api/endpoints';
import * as httpClientModule from './http-client';

describe('HttpClient auth refresh handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.history.replaceState({}, '', '/chatbot/list');
  });

  it('redirects to login when refresh returns 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
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
      )
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    const assignMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        pathname: '/chatbot/list',
        search: '',
        assign: assignMock,
      },
      writable: true,
    });

    const client = httpClientModule.createHttpClient({
      baseUrl: 'https://api.mealio.test',
    });

    await expect(client.get(API_ENDPOINTS.users.me)).rejects.toMatchObject({
      status: 401,
    });
    expect(assignMock).toHaveBeenCalledWith('/login?next=%2Fchatbot%2Flist');
  });
});
