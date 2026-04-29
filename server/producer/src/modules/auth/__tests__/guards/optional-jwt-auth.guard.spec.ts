import { UnauthorizedException } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../../guards/optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard', () => {
  const makeContext = (request: { cookies?: { accessToken?: string }; user?: { id: number } }) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as never;

  it('accessToken이 없으면 익명 요청으로 통과한다', () => {
    const jwt = { verify: jest.fn() };
    const guard = new OptionalJwtAuthGuard(jwt as never);
    const req = { cookies: {} };

    const result = guard.canActivate(makeContext(req));

    expect(result).toBe(true);
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  it('유효한 accessToken이면 user를 주입하고 통과한다', () => {
    const jwt = { verify: jest.fn().mockReturnValue({ sub: '7' }) };
    const guard = new OptionalJwtAuthGuard(jwt as never);
    const req: { cookies: { accessToken: string }; user?: { id: number } } = {
      cookies: { accessToken: 'valid-token' },
    };

    const result = guard.canActivate(makeContext(req));

    expect(result).toBe(true);
    expect(req.user).toEqual({ id: 7 });
  });

  it('유효하지 않은 accessToken이면 UnauthorizedException을 던진다', () => {
    const jwt = { verify: jest.fn().mockImplementation(() => {
      throw new Error('invalid');
    }) };
    const guard = new OptionalJwtAuthGuard(jwt as never);
    const req = { cookies: { accessToken: 'invalid-token' } };

    expect(() => guard.canActivate(makeContext(req))).toThrow(UnauthorizedException);
  });
});
