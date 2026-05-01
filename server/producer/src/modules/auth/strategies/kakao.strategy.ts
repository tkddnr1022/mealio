import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { OAuthProfile } from '../types/oauth.types';
import { AUTH_PROVIDERS } from '../constants/auth-providers';

/** Kakao /v2/user/me 응답 구조 */
interface KakaoUserMeResponse {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: { nickname?: string };
  };
}

@Injectable()
export class KakaoStrategy extends PassportStrategy(
  Strategy,
  AUTH_PROVIDERS.KAKAO,
) {
  constructor(private readonly config: ConfigService) {
    const clientID = config.getOrThrow<string>('KAKAO_CLIENT_ID');
    const clientSecret = config.getOrThrow<string>('KAKAO_CLIENT_SECRET');
    const callbackBase = config
      .getOrThrow<string>('OAUTH_CALLBACK_BASE_URL')
      .replace(/\/$/, '');
    super({
      clientID,
      clientSecret,
      callbackURL: `${callbackBase}/api/v1/auth/${AUTH_PROVIDERS.KAKAO}/callback`,
      authorizationURL: 'https://kauth.kakao.com/oauth/authorize',
      tokenURL: 'https://kauth.kakao.com/oauth/token',
      scope: ['profile_nickname', 'account_email'],
      scopeSeparator: ' ',
      customHeaders: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });
  }

  userProfile(accessToken: string, done: (err?: Error | null, profile?: KakaoUserMeResponse) => void): void {
    fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((response: globalThis.Response) => {
        if (!response.ok) {
          return response
            .text()
            .then((t) => Promise.reject(new Error(t || response.statusText)));
        }
        return response.json() as Promise<KakaoUserMeResponse>;
      })
      .then((body) => done(null, body))
      .catch((err) => done(err));
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: KakaoUserMeResponse,
  ): OAuthProfile {
    const providerId = String(profile?.id ?? '');
    const email =
      profile?.kakao_account?.email ?? `${providerId}@kakao.user`;
    const nickname =
      profile?.kakao_account?.profile?.nickname?.trim() ??
      email.split('@')[0] ??
      'user';
    return {
      provider: AUTH_PROVIDERS.KAKAO,
      providerId,
      email,
      nickname,
    };
  }
}
