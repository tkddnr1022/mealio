import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { KAFKA_TOPICS, UserEventType } from '@cook/shared';
import { User } from '@cook/shared/prisma-client';
import { UserRepository } from '../../infrastructure/database/repositories/postgresql/user.repository';
import { KafkaProducerService } from '../../infrastructure/kafka/producer.service';
import { OAuthProfile } from './types/oauth.types';
import {
  AuthProvider,
  isSupportedProvider,
} from './constants/auth-providers';
import { randomBytes } from 'crypto';

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
    if (provider === 'google') {
      return this.getGoogleAuthUrl(state);
    }
    if (provider === 'kakao') {
      return this.getKakaoAuthUrl(state);
    }
    if (provider === 'naver') {
      return this.getNaverAuthUrl(state);
    }
    throw new BadRequestException(`Unsupported provider: ${provider}`);
  }

  /**
   * 로그인 성공 후 리다이렉트할 프론트엔드 URL (환경 변수).
   */
  getLoginSuccessRedirectUrl(): string {
    return this.config.getOrThrow<string>('FRONTEND_LOGIN_SUCCESS_URL');
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

  private getGoogleAuthUrl(state?: string): string {
    const clientId = this.config.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.getCallbackUrl('google');
    const scope = encodeURIComponent('email profile');
    const stateParam = state ? `&state=${encodeURIComponent(state)}` : '';
    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}${stateParam}`;
  }

  private getKakaoAuthUrl(state?: string): string {
    const clientId = this.config.getOrThrow<string>('KAKAO_CLIENT_ID');
    const redirectUri = this.getCallbackUrl('kakao');
    const scope = encodeURIComponent('profile_nickname account_email');
    const stateParam = state ? `&state=${encodeURIComponent(state)}` : '';
    return `https://kauth.kakao.com/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}${stateParam}`;
  }

  private getNaverAuthUrl(state?: string): string {
    const clientId = this.config.getOrThrow<string>('NAVER_CLIENT_ID');
    const redirectUri = this.getCallbackUrl('naver');
    const stateParam = state ? `&state=${encodeURIComponent(state)}` : '';
    return `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}${stateParam}`;
  }

  /** 백엔드 콜백 URL (Provider 개발자 콘솔에 등록할 URL). */
  getCallbackUrl(provider: AuthProvider): string {
    const base = this.config.getOrThrow<string>('OAUTH_CALLBACK_BASE_URL').replace(/\/$/, '');
    return `${base}/api/v1/auth/${provider}/callback`;
  }
}
