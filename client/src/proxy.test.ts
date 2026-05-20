import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { proxy } from './proxy';

describe('proxy auth gate', () => {
  it('allows protected path when refresh token exists', () => {
    const request = new NextRequest('https://mealio.test/chatbot/list', {
      headers: { cookie: 'refreshToken=opaque-token' },
    });

    const response = proxy(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });

  it('redirects to login with next when refresh token missing', () => {
    const request = new NextRequest(
      'https://mealio.test/inventory/ingredients',
    );
    const response = proxy(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://mealio.test/login?next=%2Finventory%2Fingredients',
    );
  });
});
