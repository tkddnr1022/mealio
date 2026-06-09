import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@mealio/shared';
import { AuthService } from '../../auth.service';
import { UserRepository } from '../../../../infrastructure/database/repositories/postgresql/user.repository';
import { AuthRefreshSessionRepository } from '../../../../infrastructure/database/repositories/postgresql/auth-refresh-session.repository';
import { KafkaProducerService } from '../../../../infrastructure/kafka/producer.service';
import { createHash } from 'crypto';

describe('AuthService', () => {
  let service: AuthService;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        ACCESS_TOKEN_TTL_SEC: '900',
        REFRESH_TOKEN_TTL_SEC: '1209600',
        REFRESH_TOKEN_BYTES: '32',
        FRONTEND_APP_BASE_URL: 'http://localhost:4000',
        OAUTH_STATE_TTL_SEC: '600',
      };
      return values[key] ?? 'test';
    }),
    get: jest.fn(() => undefined),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('signed-access-token'),
  };

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockUserRepository = {};

  const mockAuthRefreshSessionRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    replaceAndRevoke: jest.fn(),
    revokeById: jest.fn(),
    revokeByUserId: jest.fn(),
    findActiveSessionIdsByUserId: jest.fn().mockResolvedValue([]),
  };

  const mockKafkaProducerService = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: UserRepository, useValue: mockUserRepository },
        {
          provide: AuthRefreshSessionRepository,
          useValue: mockAuthRefreshSessionRepository,
        },
        { provide: KafkaProducerService, useValue: mockKafkaProducerService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('issueTokens는 access/refresh 토큰을 함께 발급한다', async () => {
    mockAuthRefreshSessionRepository.create.mockResolvedValue({
      id: '11111111-1111-1111-1111-111111111111',
      userId: 1,
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 1000),
      revokedAt: null,
      replacedBySessionId: null,
      lastUsedAt: null,
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const tokens = await service.issueTokens(1, {
      userAgent: 'Mozilla',
      ipAddress: '127.0.0.1',
    });

    expect(tokens.accessToken).toBe('signed-access-token');
    expect(tokens.refreshToken).toContain('.');
    expect(mockAuthRefreshSessionRepository.create).toHaveBeenCalledTimes(1);
    expect(mockRedisService.set).toHaveBeenCalledTimes(1);
  });

  it('rotateTokens는 유효한 refresh token으로 세션을 회전한다', async () => {
    const validSecret = 'opaque-secret';
    const tokenHash = createHash('sha256').update(validSecret).digest('hex');
    const expiresAt = new Date(Date.now() + 60_000);

    mockRedisService.get.mockResolvedValue(
      JSON.stringify({
        userId: 7,
        tokenHash,
        expiresAt: expiresAt.toISOString(),
        revokedAt: null,
        replacedBySessionId: null,
      }),
    );
    mockAuthRefreshSessionRepository.replaceAndRevoke.mockResolvedValue({
      id: '22222222-2222-2222-2222-222222222222',
      userId: 7,
      tokenHash: 'next-hash',
      expiresAt: new Date(Date.now() + 120_000),
      revokedAt: null,
      replacedBySessionId: null,
      lastUsedAt: null,
      userAgent: null,
      ipAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const tokens = await service.rotateTokens(`session-1.${validSecret}`);

    expect(tokens.accessToken).toBe('signed-access-token');
    expect(tokens.refreshToken).toContain('.');
    expect(tokens.refreshToken.startsWith('session-1.')).toBe(false);
    expect(
      mockAuthRefreshSessionRepository.replaceAndRevoke,
    ).toHaveBeenCalledTimes(1);
    expect(mockRedisService.del).toHaveBeenCalledWith(
      'auth:refresh:session:session-1',
    );
  });

  it('buildOAuthState는 64자 hex CSRF 토큰을 반환한다', () => {
    const state = service.buildOAuthState();
    expect(state).toMatch(/^[0-9a-f]{64}$/);
    expect(service.buildOAuthState()).not.toBe(state);
  });

  it('resolveOAuthCallbackSafeNext는 query next를 storedNext보다 우선한다', () => {
    expect(
      service.resolveOAuthCallbackSafeNext('/query', '/stored'),
    ).toBe('/query');
    expect(service.resolveOAuthCallbackSafeNext(undefined, '/stored')).toBe(
      '/stored',
    );
    expect(
      service.resolveOAuthCallbackSafeNext('//evil', '/stored'),
    ).toBe('/stored');
  });
});
