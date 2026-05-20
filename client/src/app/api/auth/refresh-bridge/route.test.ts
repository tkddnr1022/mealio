import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from './route';

describe('refresh bridge route', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('forwards set-cookie and redirects to next on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(null, {
          status: 200,
          headers: {
            'set-cookie': 'accessToken=next; Path=/; HttpOnly',
          },
        }),
      ),
    );

    const request = new NextRequest(
      'https://mealio.test/api/auth/refresh-bridge?next=%2Fchatbot%2Flist',
      {
        headers: { cookie: 'refreshToken=opaque-token' },
      },
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://mealio.test/chatbot/list',
    );
    expect(response.headers.get('set-cookie')).toContain('accessToken=next');
  });

  it('redirects to login when refresh fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );

    const request = new NextRequest(
      'https://mealio.test/api/auth/refresh-bridge?next=%2Finventory%2Frecipes',
      {
        headers: { cookie: 'refreshToken=expired' },
      },
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://mealio.test/login?next=%2Finventory%2Frecipes',
    );
  });
});
