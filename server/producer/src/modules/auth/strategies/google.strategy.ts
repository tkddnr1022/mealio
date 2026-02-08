import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { OAuthProfile } from '../types/oauth.types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly config: ConfigService) {
    const clientID = config.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const clientSecret = config.getOrThrow<string>('GOOGLE_CLIENT_SECRET');
    const callbackBase = config.getOrThrow<string>('OAUTH_CALLBACK_BASE_URL').replace(/\/$/, '');
    super({
      clientID,
      clientSecret,
      callbackURL: `${callbackBase}/api/v1/auth/google/callback`, // TODO: 콜백 URL 관리 통일
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): OAuthProfile {
    const email = profile.emails?.[0]?.value ?? '';
    const nickname = profile.displayName ?? email.split('@')[0] ?? 'user';
    return {
      provider: 'google',
      providerId: profile.id,
      email,
      nickname,
    };
  }
}
