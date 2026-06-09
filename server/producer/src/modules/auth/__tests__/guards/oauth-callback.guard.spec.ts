import {
  BadRequestException,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuthCallbackGuard } from '../../guards/oauth-callback.guard';
import { OAUTH_STATE_COOKIE_NAME } from '../../../../constants/auth-cookie.constants';

jest.mock('passport', () => ({
  authenticate: jest.fn(),
}));

import passport from 'passport';

describe('OAuthCallbackGuard', () => {
  const validState = 'a'.repeat(64);
  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'NODE_ENV') return 'development';
      return 'test';
    }),
  };

  const makeGuard = () =>
    new OAuthCallbackGuard(mockConfigService as unknown as ConfigService);

  const makeContext = (request: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({
          clearCookie: jest.fn(),
        }),
        getNext: () => jest.fn(),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    (passport.authenticate as jest.Mock).mockReturnValue(() => undefined);
  });

  it('지원하지 않는 provider면 BadRequestException을 던진다', async () => {
    const guard = makeGuard();

    await expect(
      guard.canActivate(
        makeContext({
          params: { provider: 'unknown' },
          query: {},
          cookies: {},
        }),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('Provider error 쿼리가 있으면 state 검증 없이 통과한다', async () => {
    const guard = makeGuard();

    const result = await guard.canActivate(
      makeContext({
        params: { provider: 'google' },
        query: { error: 'access_denied' },
        cookies: {},
      }),
    );

    expect(result).toBe(true);
    expect(passport.authenticate).not.toHaveBeenCalled();
  });

  it('state 누락 시 UnauthorizedException을 던진다', async () => {
    const guard = makeGuard();

    await expect(
      guard.canActivate(
        makeContext({
          params: { provider: 'google' },
          query: { code: 'auth-code' },
          cookies: { [OAUTH_STATE_COOKIE_NAME]: validState },
        }),
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(passport.authenticate).not.toHaveBeenCalled();
  });

  it('state 불일치 시 UnauthorizedException을 던진다', async () => {
    const guard = makeGuard();
    const mismatchedState = 'b'.repeat(64);

    await expect(
      guard.canActivate(
        makeContext({
          params: { provider: 'google' },
          query: { state: validState, code: 'auth-code' },
          cookies: { [OAUTH_STATE_COOKIE_NAME]: mismatchedState },
        }),
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(passport.authenticate).not.toHaveBeenCalled();
  });

  it('state 검증 성공 시 passport authenticate를 호출한다', async () => {
    const response = { clearCookie: jest.fn() };
    const guard = makeGuard();

    (passport.authenticate as jest.Mock).mockImplementation(
      (_provider, _options, callback) => {
        return () => {
          callback(null, {
            provider: 'google',
            providerId: '1',
            email: 'a@example.com',
            nickname: 'user',
          });
        };
      },
    );

    const request = {
      params: { provider: 'google' },
      query: { state: validState, code: 'auth-code' },
      cookies: { [OAUTH_STATE_COOKIE_NAME]: validState },
    };

    const result = await guard.canActivate({
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
        getNext: () => jest.fn(),
      }),
    } as ExecutionContext);

    expect(result).toBe(true);
    expect(response.clearCookie).toHaveBeenCalledWith(
      OAUTH_STATE_COOKIE_NAME,
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', path: '/' }),
    );
    expect(passport.authenticate).toHaveBeenCalledWith(
      'google',
      { session: false },
      expect.any(Function),
    );
  });
});
