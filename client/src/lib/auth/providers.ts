/**
 * OAuth Provider 식별자·진입 URL 빌드 유틸.
 *
 * OAuth는 **백엔드 주도** 흐름을 따른다(`agent/backend/guidelines/oauth_implementation_guidelines.md`).
 * 프론트엔드는 `GET /api/v1/auth/{provider}`로 브라우저를 이동(리다이렉트)시키기만 하면 된다.
 * Authorization Code 처리·토큰 교환·JWT 쿠키 설정은 백엔드에서 전담한다.
 *
 * 지원 Provider 목록은 `env.enabledOAuthProviders` 플래그로 노출 여부를 제어한다.
 * 실제 UI에서는 {@link isOAuthProviderEnabled}와 함께 사용해 비활성 Provider 버튼을 숨긴다.
 */

import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { env, isOAuthProviderEnabled } from '@/lib/config/env';
import { OAUTH_PROVIDERS } from '@/lib/types/auth';
import type { OAuthProvider } from '@/lib/types/auth';

export type { OAuthProvider } from '@/lib/types/auth';

/** Provider 표시명 (로그인 버튼 라벨 등) */
export const OAUTH_PROVIDER_LABELS: Readonly<Record<OAuthProvider, string>> = {
  google: 'Google',
  kakao: '카카오',
  naver: '네이버',
};

export function isOAuthProvider(value: unknown): value is OAuthProvider {
  return (
    typeof value === 'string' &&
    (OAUTH_PROVIDERS as readonly string[]).includes(value)
  );
}

/**
 * 소셜 로그인 버튼 클릭 시 브라우저를 이동시킬 백엔드 진입 URL을 생성한다.
 *
 * - `env.apiBaseUrl`이 설정된 경우 절대 URL(`https://api.example.com/api/v1/auth/google`).
 * - 비어 있으면 same-origin 상대 경로(`/api/v1/auth/google`)를 반환한다.
 *   (Next.js 리라이트 또는 동일 오리진 배포 환경)
 *
 * @example
 * window.location.assign(buildOAuthEntryUrl('google'));
 */
export function buildOAuthEntryUrl(provider: OAuthProvider): string {
  const path = API_ENDPOINTS.auth.provider(provider);
  if (!env.apiBaseUrl) return path;
  return `${env.apiBaseUrl}${path}`;
}

/**
 * 현재 환경에서 사용자가 실제로 클릭 가능한 Provider 목록을 반환한다.
 * 명세상의 정렬 순서(`OAUTH_PROVIDERS`)를 유지하고, 환경 변수 플래그로 비활성화된
 * Provider는 제외된다.
 */
export function getEnabledOAuthProviders(): readonly OAuthProvider[] {
  return env.enabledOAuthProviders;
}

export { isOAuthProviderEnabled };
