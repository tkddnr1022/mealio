import { ConfigService } from '@nestjs/config';

import {
  getAuthCookieOptions,
  resolveAuthCookieDomain,
} from './auth-cookie-options.util';

function mockConfig(
  values: Record<string, string | undefined>,
): ConfigService {
  return {
    get: (key: string) => values[key],
    getOrThrow: (key: string) => {
      const value = values[key];
      if (value === undefined) {
        throw new Error(`Missing config: ${key}`);
      }
      return value;
    },
  } as unknown as ConfigService;
}

describe('resolveAuthCookieDomain', () => {
  it('derives parent domain when frontend and API differ by subdomain', () => {
    const config = mockConfig({
      APP_ENV: 'production',
      FRONTEND_APP_BASE_URL: 'https://mealio.site',
      OAUTH_CALLBACK_BASE_URL: 'https://api.mealio.site',
    });

    expect(resolveAuthCookieDomain(config)).toBe('.mealio.site');
  });

  it('derives parent domain for www and api subdomains', () => {
    const config = mockConfig({
      APP_ENV: 'production',
      FRONTEND_APP_BASE_URL: 'https://www.mealio.site',
      OAUTH_CALLBACK_BASE_URL: 'https://api.mealio.site',
    });

    expect(resolveAuthCookieDomain(config)).toBe('.mealio.site');
  });

  it('returns undefined for same host', () => {
    const config = mockConfig({
      APP_ENV: 'production',
      FRONTEND_APP_BASE_URL: 'https://mealio.site',
      OAUTH_CALLBACK_BASE_URL: 'https://mealio.site',
    });

    expect(resolveAuthCookieDomain(config)).toBeUndefined();
  });

  it('returns undefined for localhost', () => {
    const config = mockConfig({
      APP_ENV: 'local',
      FRONTEND_APP_BASE_URL: 'http://localhost:4000',
      OAUTH_CALLBACK_BASE_URL: 'http://localhost:3000',
    });

    expect(resolveAuthCookieDomain(config)).toBeUndefined();
  });

  it('returns undefined when registrable domains differ', () => {
    const config = mockConfig({
      APP_ENV: 'production',
      FRONTEND_APP_BASE_URL: 'https://mealio.site',
      OAUTH_CALLBACK_BASE_URL: 'https://api.other.example.com',
    });

    expect(resolveAuthCookieDomain(config)).toBeUndefined();
  });
});

describe('getAuthCookieOptions', () => {
  it('includes domain in production split-domain setup', () => {
    const config = mockConfig({
      APP_ENV: 'production',
      FRONTEND_APP_BASE_URL: 'https://mealio.site',
      OAUTH_CALLBACK_BASE_URL: 'https://api.mealio.site',
    });

    expect(getAuthCookieOptions(config)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      domain: '.mealio.site',
    });
  });

  it('omits domain on local development', () => {
    const config = mockConfig({
      APP_ENV: 'local',
      FRONTEND_APP_BASE_URL: 'http://localhost:4000',
      OAUTH_CALLBACK_BASE_URL: 'http://localhost:3000',
    });

    expect(getAuthCookieOptions(config)).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
  });
});
