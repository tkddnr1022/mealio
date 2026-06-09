/**
 * 인증·OAuth TTL·토큰 크기 정책.
 *
 * JWT 만료, refresh 세션·쿠키 Max-Age, OAuth state 쿠키 TTL 등에 사용한다.
 */
export const ACCESS_TOKEN_TTL_SECONDS = 900;
export const REFRESH_TOKEN_TTL_SECONDS = 1_209_600;
export const REFRESH_TOKEN_BYTES = 48;
export const OAUTH_STATE_TTL_SECONDS = 600;
