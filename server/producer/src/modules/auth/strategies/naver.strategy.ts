import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { OAuthProfile } from '../types/oauth.types';

const NAVER_USER_ME_URL = 'https://openapi.naver.com/v1/nid/me';

/** 네이버 /v1/nid/me 응답 구조 (resultcode 00 성공 시) */
interface NaverUserMeResponse {
  resultcode?: string;
  message?: string;
  response?: {
    id?: string;
    email?: string;
    nickname?: string;
    name?: string;
  };
}

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(private readonly config: ConfigService) {
    const clientID = config.getOrThrow<string>('NAVER_CLIENT_ID');
    const clientSecret = config.getOrThrow<string>('NAVER_CLIENT_SECRET');
    const callbackBase = config
      .getOrThrow<string>('OAUTH_CALLBACK_BASE_URL')
      .replace(/\/$/, '');
    super({
      clientID,
      clientSecret,
      callbackURL: `${callbackBase}/api/v1/auth/naver/callback`,
      authorizationURL: 'https://nid.naver.com/oauth2.0/authorize',
      tokenURL: 'https://nid.naver.com/oauth2.0/token',
      customHeaders: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
    });
  }

  userProfile(
    accessToken: string,
    done: (err?: Error | null, profile?: NaverUserMeResponse) => void,
  ): void {
    fetch(NAVER_USER_ME_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((response: globalThis.Response) => {
        if (!response.ok) {
          return response
            .text()
            .then((t) => Promise.reject(new Error(t || response.statusText)));
        }
        return response.json() as Promise<NaverUserMeResponse>;
      })
      .then((body) => done(null, body))
      .catch((err) => done(err));
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: NaverUserMeResponse,
  ): OAuthProfile {
    const data = profile?.response ?? {};
    const providerId = String(data.id ?? '');
    const email = data.email?.trim() ?? `${providerId}@naver.user`;
    const nickname =
      data.nickname?.trim() ||
      data.name?.trim() ||
      email.split('@')[0] ||
      'user';
    return {
      provider: 'naver',
      providerId,
      email,
      nickname,
    };
  }
}
