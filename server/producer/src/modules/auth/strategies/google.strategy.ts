import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { OAuthProfile } from '../types/oauth.types';
import { AUTH_PROVIDERS } from '../constants/auth-providers';

@Injectable()
export class GoogleStrategy extends PassportStrategy(
  Strategy,
  AUTH_PROVIDERS.GOOGLE,
) {
  constructor(private readonly config: ConfigService) {
    const clientID = config.getOrThrow<string>('GOOGLE_CLIENT_ID');
    const clientSecret = config.getOrThrow<string>('GOOGLE_CLIENT_SECRET');
    const callbackBase = config.getOrThrow<string>('OAUTH_CALLBACK_BASE_URL').replace(/\/$/, '');
    super({
      clientID,
      clientSecret,
      callbackURL: `${callbackBase}/api/v1/auth/${AUTH_PROVIDERS.GOOGLE}/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): OAuthProfile {
    const email = profile.emails?.[0]?.value ?? '';
    const nickname = profile.displayName ?? email.split('@')[0] ?? 'user';
    return {
      provider: AUTH_PROVIDERS.GOOGLE,
      providerId: profile.id,
      email,
      nickname,
    };
  }
}
