import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '@mealio/shared';
import { KAFKA_TOPICS, UserEventType } from '@mealio/shared';
import { User } from '@mealio/shared/prisma-client';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import { AuthRefreshSessionRepository } from '../../infrastructure/database/repositories/postgresql/auth-refresh-session.repository';
import { KafkaProducerService } from '../../infrastructure/kafka/producer.service';
import { OAuthProfile } from './types/oauth.types';
import {
  FRONTEND_OAUTH_ERROR_PATH,
  FRONTEND_OAUTH_SUCCESS_CALLBACK_PATH,
} from '../../constants/auth.constants';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  OAUTH_STATE_TTL_SECONDS,
  REFRESH_TOKEN_BYTES,
  REFRESH_TOKEN_TTL_SECONDS,
} from '../../policy/auth.policy';
import {
  AUTH_PROVIDERS,
  AuthProvider,
  isSupportedProvider,
} from './constants/auth-providers';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'crypto';

export const OAUTH_FAILURE_QUERY_KEYS = {
  errorCode: 'errorCode',
  errorMessage: 'errorMessage',
  next: 'next',
} as const;

/** Redis 캐시에 저장하는 refresh 세션 스냅샷 (SSOT는 DB). */
type RefreshSessionCachePayload = {
  userId: number;
  tokenHash: string;
  expiresAt: string;
  revokedAt: string | null;
  replacedBySessionId: string | null;
};

/** 로그인·갱신 시 세션 메타(선택). */
export type AuthIssueContext = {
  userAgent?: string;
  ipAddress?: string;
};

/** Access JWT + opaque refresh 토큰 쌍. */
export type IssuedAuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly redisService: RedisService,
    private readonly userRepository: UserRepository,
    private readonly authRefreshSessionRepository: AuthRefreshSessionRepository,
    private readonly kafkaProducerService: KafkaProducerService,
  ) {}

  /**
   * OAuth 진입: Provider 인증 URL로 302 리다이렉트할 URL 반환.
   * 지원하지 않는 provider면 BadRequest.
   */
  getAuthUrl(provider: string, state?: string): string {
    if (!isSupportedProvider(provider)) {
      throw new BadRequestException(`Unsupported provider: ${provider}`);
    }

    const authUrlBuilders: Record<AuthProvider, (state?: string) => string> = {
      [AUTH_PROVIDERS.GOOGLE]: (nextState?: string) =>
        this.getGoogleAuthUrl(nextState),
      [AUTH_PROVIDERS.KAKAO]: (nextState?: string) =>
        this.getKakaoAuthUrl(nextState),
      [AUTH_PROVIDERS.NAVER]: (nextState?: string) =>
        this.getNaverAuthUrl(nextState),
    };
    return authUrlBuilders[provider](state);
  }

  /** 프론트 앱 베이스 URL (트레일링 슬래시 제거). */
  private getFrontendAppBaseUrl(): string {
    return this.config
      .getOrThrow<string>('FRONTEND_APP_BASE_URL')
      .replace(/\/$/, '');
  }

  /**
   * OAuth 성공 후 302 목적지: `/oauth/callback`(검증된 `next`가 있으면 `?next=` 포함).
   * 기본 `next`는 프론트 콜백 페이지가 결정한다.
   */
  buildLoginSuccessRedirectUrl(safeNext: string | null): string {
    const base = this.getFrontendAppBaseUrl();
    const callbackUrl = new URL(
      FRONTEND_OAUTH_SUCCESS_CALLBACK_PATH,
      `${base}/`,
    );
    if (safeNext) {
      callbackUrl.searchParams.set(OAUTH_FAILURE_QUERY_KEYS.next, safeNext);
    }
    return callbackUrl.toString();
  }

  /**
   * OAuth 콜백 실패 리다이렉트 URL을 조립한다.
   * - 기준: FRONTEND_APP_BASE_URL + FRONTEND_OAUTH_ERROR_PATH
   * - 쿼리: errorCode, errorMessage, optional next(안전한 경로만)
   */
  buildOAuthFailureRedirectUrl({
    errorCode,
    errorMessage,
    next,
  }: {
    errorCode: string;
    errorMessage: string;
    next?: string | null;
  }): string {
    const base = this.getFrontendAppBaseUrl();
    const redirectUrl = new URL(FRONTEND_OAUTH_ERROR_PATH, `${base}/`);
    redirectUrl.searchParams.set(OAUTH_FAILURE_QUERY_KEYS.errorCode, errorCode);
    redirectUrl.searchParams.set(
      OAUTH_FAILURE_QUERY_KEYS.errorMessage,
      errorMessage,
    );
    const safeNext = this.resolveSafeNextPath(next);
    if (safeNext) {
      redirectUrl.searchParams.set(OAUTH_FAILURE_QUERY_KEYS.next, safeNext);
    }
    return redirectUrl.toString();
  }

  /**
   * 오픈 리다이렉트 방지를 위해 안전한 next 경로만 허용한다.
   * - `/`로 시작
   * - `//`로 시작하지 않음
   */
  resolveSafeNextPath(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed.startsWith('/')) return null;
    if (trimmed.startsWith('//')) return null;
    return trimmed;
  }

  /**
   * 콜백 쿼리 `next`와 로그인 진입 시 저장한 쿠키 `next` 중 안전한 상대 경로를 고른다 (`next` 우선).
   */
  resolveOAuthCallbackSafeNext(
    next?: string | null,
    storedNext?: string | null,
  ): string | null {
    return (
      this.resolveSafeNextPath(next) ?? this.resolveSafeNextPath(storedNext)
    );
  }

  /**
   * Provider가 `error` 쿼리로 인증 실패를 통지한 경우 프론트 실패 리다이렉트 URL을 반환한다.
   * 해당 없으면 `null`.
   */
  buildOAuthProviderErrorRedirectUrl({
    next,
    storedNext,
    oauthError,
    oauthErrorDescription,
  }: {
    next?: string | null | undefined;
    storedNext?: string | null | undefined;
    oauthError?: string | null | undefined;
    oauthErrorDescription?: string | null | undefined;
  }): string | null {
    const safeNext = this.resolveOAuthCallbackSafeNext(next, storedNext);
    if (!oauthError || oauthError.trim().length === 0) {
      return null;
    }
    return this.buildOAuthFailureRedirectUrl({
      errorCode: oauthError,
      errorMessage:
        oauthErrorDescription?.trim() || 'OAuth authentication failed',
      next: safeNext,
    });
  }

  /**
   * OAuth 프로필로 사용자 조회 또는 생성 후 User 반환.
   * 기존 사용자면 USER_EVENTS에 login, 신규면 signup 이벤트 발행.
   */
  async findOrCreateUser(profile: OAuthProfile): Promise<User> {
    const existing = await this.userRepository.findByPlatform(
      profile.provider,
      profile.providerId,
    );
    if (existing) {
      await this.emitLoginEvent(existing.id, profile.provider);
      return existing;
    }
    const user = await this.userRepository.create({
      email: profile.email,
      nickname: profile.nickname.slice(0, 50),
      platformName: profile.provider,
      platformId: profile.providerId,
    });
    await this.emitSignupEvent(user.id, profile.provider);
    return user;
  }

  private async emitLoginEvent(
    userId: number,
    provider: string,
  ): Promise<void> {
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, {
      type: UserEventType.LOGIN,
      userId,
      provider,
      timestamp: new Date().toISOString(),
    });
  }

  private async emitSignupEvent(
    userId: number,
    provider: string,
  ): Promise<void> {
    await this.kafkaProducerService.emit(KAFKA_TOPICS.USER_EVENTS, {
      type: UserEventType.SIGNUP,
      userId,
      provider,
      timestamp: new Date().toISOString(),
    });
  }

  /** 사용자 ID로 JWT accessToken 발급. */
  issueAccessToken(userId: number): string {
    return this.jwt.sign(
      { sub: String(userId) },
      { expiresIn: this.getAccessTokenTtlSeconds() },
    );
  }

  /** 로그인·OAuth 콜백 성공 시 access + refresh(opaque) 동시 발급. */
  async issueTokens(
    userId: number,
    context?: AuthIssueContext,
  ): Promise<IssuedAuthTokens> {
    const accessToken = this.issueAccessToken(userId);
    const { refreshToken } = await this.createRefreshSession(userId, context);
    return { accessToken, refreshToken };
  }

  /**
   * refresh 토큰 검증 후 회전: 기존 세션 revoke, 신규 세션·토큰 발급.
   * 재사용·위조 감지 시 해당 사용자 활성 세션 전체 revoke.
   */
  async rotateTokens(
    refreshToken: string,
    context?: AuthIssueContext,
  ): Promise<IssuedAuthTokens> {
    const parsed = this.parseOpaqueRefreshToken(refreshToken);
    const session =
      (await this.getRefreshSessionFromCache(parsed.sessionId)) ??
      (await this.authRefreshSessionRepository.findById(parsed.sessionId));

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const now = new Date();

    if (session.revokedAt || session.replacedBySessionId) {
      await this.revokeAllUserSessions(session.userId);
      throw new UnauthorizedException('Refresh token was already used');
    }

    if (session.expiresAt.getTime() <= now.getTime()) {
      await this.revokeRefreshSession(session.id);
      throw new UnauthorizedException('Refresh token expired');
    }

    const secretHash = this.hashRefreshSecret(parsed.secret);
    if (!this.secureEquals(secretHash, session.tokenHash)) {
      await this.revokeAllUserSessions(session.userId);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const nextSession = this.createRefreshSessionData(session.userId, {
      userAgent: context?.userAgent,
      ipAddress: context?.ipAddress,
    });

    const rotated = await this.authRefreshSessionRepository.replaceAndRevoke({
      oldSessionId: session.id,
      revokedAt: now,
      newSession: {
        id: nextSession.sessionId,
        user: { connect: { id: session.userId } },
        tokenHash: nextSession.tokenHash,
        expiresAt: nextSession.expiresAt,
        userAgent: context?.userAgent?.slice(0, 512) || null,
        ipAddress: context?.ipAddress?.slice(0, 64) || null,
      },
    });

    await this.deleteRefreshSessionCache(session.id);
    await this.cacheRefreshSession({
      id: rotated.id,
      userId: rotated.userId,
      tokenHash: rotated.tokenHash,
      expiresAt: rotated.expiresAt,
      revokedAt: rotated.revokedAt,
      replacedBySessionId: rotated.replacedBySessionId,
    });

    return {
      accessToken: this.issueAccessToken(session.userId),
      refreshToken: `${nextSession.sessionId}.${nextSession.secret}`,
    };
  }

  /** 단일 refresh 세션을 DB·Redis에서 폐기한다. */
  async revokeRefreshSession(sessionId: string): Promise<void> {
    await this.authRefreshSessionRepository.revokeById(sessionId, new Date());
    await this.deleteRefreshSessionCache(sessionId);
  }

  /** 사용자의 활성 refresh 세션을 모두 폐기한다(로그아웃·재사용 대응). */
  async revokeAllUserSessions(userId: number): Promise<void> {
    const activeSessionIds =
      await this.authRefreshSessionRepository.findActiveSessionIdsByUserId(
        userId,
      );
    await this.authRefreshSessionRepository.revokeByUserId(userId, new Date());
    await Promise.all(
      activeSessionIds.map((sessionId) =>
        this.deleteRefreshSessionCache(sessionId),
      ),
    );
  }

  /** accessToken JWT·쿠키 Max-Age(초). */
  getAccessTokenTtlSeconds(): number {
    return ACCESS_TOKEN_TTL_SECONDS;
  }

  /** refresh 세션·쿠키 TTL(초). */
  getRefreshTokenTtlSeconds(): number {
    return REFRESH_TOKEN_TTL_SECONDS;
  }

  /** Set-Cookie `refreshToken` maxAge(ms). */
  getRefreshTokenCookieMaxAgeMs(): number {
    return this.getRefreshTokenTtlSeconds() * 1000;
  }

  /** Set-Cookie `accessToken` maxAge(ms). */
  getAccessTokenCookieMaxAgeMs(): number {
    return this.getAccessTokenTtlSeconds() * 1000;
  }

  /** DB에 세션 저장 후 Redis write-through, opaque `sessionId.secret` 반환. */
  private async createRefreshSession(
    userId: number,
    context?: AuthIssueContext,
  ): Promise<{ refreshToken: string }> {
    const created = this.createRefreshSessionData(userId, context);
    await this.authRefreshSessionRepository.create({
      id: created.sessionId,
      user: { connect: { id: userId } },
      tokenHash: created.tokenHash,
      expiresAt: created.expiresAt,
      userAgent: context?.userAgent?.slice(0, 512) || null,
      ipAddress: context?.ipAddress?.slice(0, 64) || null,
    });
    await this.cacheRefreshSession({
      id: created.sessionId,
      userId,
      tokenHash: created.tokenHash,
      expiresAt: created.expiresAt,
      revokedAt: null,
      replacedBySessionId: null,
    });
    return { refreshToken: `${created.sessionId}.${created.secret}` };
  }

  /** 회전·신규 발급용 세션 ID·secret·해시·만료 시각 생성(저장 없음). */
  private createRefreshSessionData(
    userId: number,
    _context?: AuthIssueContext,
  ): {
    sessionId: string;
    secret: string;
    tokenHash: string;
    expiresAt: Date;
    userId: number;
  } {
    const sessionId = randomUUID();
    const secret = randomBytes(this.getRefreshTokenBytes()).toString(
      'base64url',
    );
    const tokenHash = this.hashRefreshSecret(secret);
    const expiresAt = new Date(
      Date.now() + this.getRefreshTokenTtlSeconds() * 1000,
    );
    return {
      sessionId,
      secret,
      tokenHash,
      expiresAt,
      userId,
    };
  }

  /** opaque refresh 문자열을 `sessionId`·`secret`으로 분리한다. */
  private parseOpaqueRefreshToken(refreshToken: string): {
    sessionId: string;
    secret: string;
  } {
    const token = refreshToken.trim();
    const split = token.indexOf('.');
    if (split <= 0 || split >= token.length - 1) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const sessionId = token.slice(0, split);
    const secret = token.slice(split + 1);

    if (!sessionId || !secret) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { sessionId, secret };
  }

  /** DB·캐시에는 secret 원문 대신 SHA-256 hex만 저장한다. */
  private hashRefreshSecret(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }

  /** 타이밍 공격 완화용 문자열 비교. */
  private secureEquals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.length !== rightBuffer.length) {
      return false;
    }
    return timingSafeEqual(leftBuffer, rightBuffer);
  }

  /** Redis refresh 세션 캐시 키. */
  private refreshSessionCacheKey(sessionId: string): string {
    return `auth:refresh:session:${sessionId}`;
  }

  /** 세션 스냅샷을 Redis에 TTL=만료까지 남은 시간으로 저장한다. */
  private async cacheRefreshSession(data: {
    id: string;
    userId: number;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    replacedBySessionId: string | null;
  }): Promise<void> {
    const ttlSeconds = Math.floor(
      (data.expiresAt.getTime() - Date.now()) / 1000,
    );
    if (ttlSeconds <= 0) {
      await this.deleteRefreshSessionCache(data.id);
      return;
    }

    const payload: RefreshSessionCachePayload = {
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt.toISOString(),
      revokedAt: data.revokedAt ? data.revokedAt.toISOString() : null,
      replacedBySessionId: data.replacedBySessionId,
    };
    await this.redisService.set(
      this.refreshSessionCacheKey(data.id),
      JSON.stringify(payload),
      ttlSeconds,
    );
  }

  /** Redis에서 세션 조회. 미스·파싱 실패 시 null(DB 폴백). */
  private async getRefreshSessionFromCache(sessionId: string): Promise<{
    id: string;
    userId: number;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    replacedBySessionId: string | null;
  } | null> {
    const cached = await this.redisService.get(
      this.refreshSessionCacheKey(sessionId),
    );
    if (!cached) {
      return null;
    }

    try {
      const parsed = JSON.parse(cached) as RefreshSessionCachePayload;
      return {
        id: sessionId,
        userId: parsed.userId,
        tokenHash: parsed.tokenHash,
        expiresAt: new Date(parsed.expiresAt),
        revokedAt: parsed.revokedAt ? new Date(parsed.revokedAt) : null,
        replacedBySessionId: parsed.replacedBySessionId,
      };
    } catch {
      await this.deleteRefreshSessionCache(sessionId);
      return null;
    }
  }

  /** 회전·revoke 시 이전 세션 캐시 키 삭제. */
  private async deleteRefreshSessionCache(sessionId: string): Promise<void> {
    await this.redisService.del(this.refreshSessionCacheKey(sessionId));
  }

  /** opaque secret 랜덤 바이트 수. */
  private getRefreshTokenBytes(): number {
    return REFRESH_TOKEN_BYTES;
  }

  /** Provider에 전달할 OAuth state(CSRF 토큰). */
  buildOAuthState(): string {
    return randomBytes(32).toString('hex');
  }

  /** OAuth state 쿠키 Max-Age(ms). */
  getOAuthStateCookieMaxAgeMs(): number {
    return this.getOAuthStateTtlSeconds() * 1000;
  }

  /** OAuth state TTL(초). */
  getOAuthStateTtlSeconds(): number {
    return OAUTH_STATE_TTL_SECONDS;
  }

  private getGoogleAuthUrl(state?: string): string {
    const clientId = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.getCallbackUrl(AUTH_PROVIDERS.GOOGLE);
    const scope = encodeURIComponent('email profile');
    const stateParam = state ? `&state=${encodeURIComponent(state)}` : '';
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}${stateParam}`;
  }

  private getKakaoAuthUrl(state?: string): string {
    const clientId = this.config.getOrThrow<string>('KAKAO_CLIENT_ID');
    const redirectUri = this.getCallbackUrl(AUTH_PROVIDERS.KAKAO);
    const scope = encodeURIComponent('profile_nickname account_email');
    const stateParam = state ? `&state=${encodeURIComponent(state)}` : '';
    return `https://kauth.kakao.com/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}${stateParam}`;
  }

  private getNaverAuthUrl(state?: string): string {
    const clientId = this.config.getOrThrow<string>('NAVER_CLIENT_ID');
    const redirectUri = this.getCallbackUrl(AUTH_PROVIDERS.NAVER);
    const stateParam = state ? `&state=${encodeURIComponent(state)}` : '';
    return `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}${stateParam}`;
  }

  /** 백엔드 콜백 URL (Provider 개발자 콘솔에 등록할 URL). */
  getCallbackUrl(provider: AuthProvider): string {
    const base = this.config
      .getOrThrow<string>('OAUTH_CALLBACK_BASE_URL')
      .replace(/\/$/, '');
    return `${base}/api/v1/auth/${provider}/callback`;
  }
}
