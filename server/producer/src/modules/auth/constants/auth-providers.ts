/**
 * 지원 OAuth Provider 목록.
 * 새 provider 추가 시 여기에 추가하고 strategies/ 에 전략 구현.
 */
export const AUTH_PROVIDERS = {
  GOOGLE: 'google',
  KAKAO: 'kakao',
  NAVER: 'naver',
} as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];

export const SUPPORTED_AUTH_PROVIDERS: ReadonlyArray<AuthProvider> = [
  AUTH_PROVIDERS.GOOGLE,
  AUTH_PROVIDERS.KAKAO,
  AUTH_PROVIDERS.NAVER,
];

export function isSupportedProvider(value: string): value is AuthProvider {
  return SUPPORTED_AUTH_PROVIDERS.includes(value as AuthProvider);
}
