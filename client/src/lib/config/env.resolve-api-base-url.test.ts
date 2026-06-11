import { afterEach, describe, expect, it, vi } from 'vitest';

describe('resolveApiBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    delete process.env.INTERNAL_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
  });

  it('prefers INTERNAL_API_BASE_URL on the server', async () => {
    process.env.INTERNAL_API_BASE_URL = 'http://127.0.0.1:3000';
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com';
    vi.stubGlobal('window', undefined);

    const { resolveApiBaseUrl } = await import('./env');
    expect(resolveApiBaseUrl()).toBe('http://127.0.0.1:3000');
  });

  it('falls back to NEXT_PUBLIC_API_BASE_URL on the server when internal is unset', async () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com';
    vi.stubGlobal('window', undefined);

    const { resolveApiBaseUrl } = await import('./env');
    expect(resolveApiBaseUrl()).toBe('https://api.example.com');
  });

  it('uses NEXT_PUBLIC_API_BASE_URL in the browser even when internal is set', async () => {
    process.env.INTERNAL_API_BASE_URL = 'http://127.0.0.1:3000';
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://api.example.com';
    vi.stubGlobal('window', {});

    const { resolveApiBaseUrl } = await import('./env');
    expect(resolveApiBaseUrl()).toBe('https://api.example.com');
  });
});
