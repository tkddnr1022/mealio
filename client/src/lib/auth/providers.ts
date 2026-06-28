/**
 * OAuth Provider 식별자·진입 URL 빌드 유틸.
 *
 * OAuth는 **백엔드 주도** 흐름을 따른다(`agent/backend/guidelines/oauth_implementation_guidelines.md`).
 * 프론트엔드는 `GET /api/v1/auth/{provider}`로 브라우저를 이동(리다이렉트)시키기만 하면 된다.
 * Authorization Code 처리·토큰 교환·JWT 쿠키 설정은 백엔드에서 전담한다.
 *
 * 지원 Provider 목록은 타입 상수 `OAUTH_PROVIDERS` 기준으로 고정한다.
 */

import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { env } from '@/lib/config/env';
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
 * `next`가 비어 있지 않으면 쿼리로 붙인다. 안전 여부(오픈 리다이렉트 방지)는 백엔드 `resolveSafeNextPath`가 판단한다.
 *
 * @example
 * window.location.assign(buildOAuthEntryUrl('google'));
 * window.location.assign(buildOAuthEntryUrl('google', { next: HOME_PATH }));
 */
export function buildOAuthEntryUrl(
  provider: OAuthProvider,
  options?: { next?: string | null },
): string {
  let path = API_ENDPOINTS.auth.provider(provider);
  const trimmedNext = options?.next?.trim();
  if (trimmedNext) {
    path = `${path}?next=${encodeURIComponent(trimmedNext)}`;
  }
  if (!env.apiBaseUrl) return path;
  return `${env.apiBaseUrl}${path}`;
}
