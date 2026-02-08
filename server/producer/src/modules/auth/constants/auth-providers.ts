/**
 * 지원 OAuth Provider 목록.
 * 새 provider 추가 시 여기에 추가하고 strategies/ 에 전략 구현.
 */
export const SUPPORTED_AUTH_PROVIDERS = ['google', 'kakao', 'naver'] as const;
export type AuthProvider = (typeof SUPPORTED_AUTH_PROVIDERS)[number];

export function isSupportedProvider(value: string): value is AuthProvider {
  return SUPPORTED_AUTH_PROVIDERS.includes(value as AuthProvider);
}
