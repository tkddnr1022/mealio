import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { KAFKA_TOPICS, UserEventType } from '@cook/shared';
import { User } from '@cook/shared/prisma-client';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import { KafkaProducerService } from '../../infrastructure/kafka/producer.service';
import { OAuthProfile } from './types/oauth.types';
import {
  AUTH_PROVIDERS,
  AuthProvider,
  isSupportedProvider,
} from './constants/auth-providers';
import { randomBytes } from 'crypto';

export const OAUTH_FAILURE_QUERY_KEYS = {
  errorCode: 'errorCode',
  errorMessage: 'errorMessage',
  next: 'next',
} as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly userRepository: UserRepository,
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
    return this.config.getOrThrow<string>('FRONTEND_APP_BASE_URL').replace(/\/$/, '');
  }

  /**
   * OAuth 성공 후 302 목적지: 검증된 `next` 상대 경로 또는 기본 성공 경로.
   */
  buildLoginSuccessRedirectUrl(safeNext: string | null): string {
    const base = this.getFrontendAppBaseUrl();
    const defaultPath =
      this.config.get<string>('FRONTEND_OAUTH_DEFAULT_SUCCESS_PATH')?.trim() || '/recipe';
    const path = safeNext ?? defaultPath;
    return new URL(path, `${base}/`).toString();
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
    const errorPath = this.config.getOrThrow<string>('FRONTEND_OAUTH_ERROR_PATH');
    const redirectUrl = new URL(errorPath, `${base}/`);
    redirectUrl.searchParams.set(OAUTH_FAILURE_QUERY_KEYS.errorCode, errorCode);
    redirectUrl.searchParams.set(OAUTH_FAILURE_QUERY_KEYS.errorMessage, errorMessage);
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
   * 콜백 쿼리의 `next`·`state` 중 안전한 상대 경로를 하나 고른다 (`next` 우선).
   */
  resolveOAuthCallbackSafeNext(
    next?: string | null | undefined,
    state?: string | null | undefined,
  ): string | null {
    return this.resolveSafeNextPath(next) ?? this.resolveSafeNextPath(state);
  }

  /**
   * Provider가 `error` 쿼리로 인증 실패를 통지한 경우 프론트 실패 리다이렉트 URL을 반환한다.
   * 해당 없으면 `null`.
   */
  buildOAuthProviderErrorRedirectUrl({
    next,
    state,
    oauthError,
    oauthErrorDescription,
  }: {
    next?: string | null | undefined;
    state?: string | null | undefined;
    oauthError?: string | null | undefined;
    oauthErrorDescription?: string | null | undefined;
  }): string | null {
    const safeNext = this.resolveOAuthCallbackSafeNext(next, state);
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

  /**
   * 사용자 ID로 JWT accessToken 발급.
   */
  signToken(userId: number): string {
    return this.jwt.sign({ sub: String(userId) });
  }

  /**
   * CSRF용 state 값 생성 (선택 사용).
   */
  generateState(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * OAuth state 생성.
   * - next가 안전한 경로이면 해당 값을 그대로 state에 넣어 콜백까지 전달한다.
   * - 그 외에는 랜덤 state를 사용한다.
   */
  buildOAuthState(next?: string | null): string {
    const safeNext = this.resolveSafeNextPath(next);
    if (safeNext) return safeNext;
    return this.generateState();
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
    const base = this.config.getOrThrow<string>('OAUTH_CALLBACK_BASE_URL').replace(/\/$/, '');
    return `${base}/api/v1/auth/${provider}/callback`;
  }
}
