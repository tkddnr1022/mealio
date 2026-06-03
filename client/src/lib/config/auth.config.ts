/**
 * 인증 HttpOnly 쿠키 이름.
 *
 * OpenAPI(`agent/common/openapi_spec.yaml`)·OAuth Set-Cookie 계약과 정렬한다.
 * 환경별로 바꾸지 않는 고정 상수이며, 소비처는 `@/lib/auth/session` re-export를 권장한다.
 */
export const ACCESS_TOKEN_COOKIE_NAME = 'accessToken' as const;
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken' as const;
