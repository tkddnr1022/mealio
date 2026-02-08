/**
 * OAuth 콜백 후 Provider에서 받은 사용자 프로필.
 * 각 Provider 전략(Passport)에서 이 형태로 반환.
 */
export interface OAuthProfile {
  provider: string;
  providerId: string;
  email: string;
  nickname: string;
}
