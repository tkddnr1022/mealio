/**
 * 인증 HttpOnly 쿠키 이름 (Client SSOT).
 *
 * `server/shared`는 import하지 않는다. OpenAPI·OAuth Set-Cookie 계약과 맞추며,
 * Producer `constants/auth-cookie.constants.ts`와 동일 문자열을 유지한다.
 * 소비처는 `@/lib/auth/session` re-export를 권장한다.
 */
export const ACCESS_TOKEN_COOKIE_NAME = 'accessToken' as const;
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken' as const;
