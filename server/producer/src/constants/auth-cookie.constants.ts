/**
 * 인증 HttpOnly 쿠키 이름 (Producer SSOT).
 *
 * OpenAPI·OAuth Set-Cookie 계약과 정렬한다.
 * Client는 `client/src/lib/constants/auth.constants.ts`에서 동일 문자열을 유지한다.
 */
export const ACCESS_TOKEN_COOKIE_NAME = 'accessToken' as const;
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken' as const;

/** OAuth CSRF state (HttpOnly, 로그인 진입~콜백 1회용). */
export const OAUTH_STATE_COOKIE_NAME = 'oauthState' as const;

/** OAuth 로그인 완료 후 이동 경로 (HttpOnly, 로그인 진입~콜백 1회용). */
export const OAUTH_NEXT_COOKIE_NAME = 'oauthNext' as const;
