/**
 * OAuth 프론트 리다이렉트 경로 (Producer SSOT).
 *
 * `FRONTEND_APP_BASE_URL`과 조합해 성공·실패 302 목적지를 만든다.
 * Client `(auth)/oauth/error` 라우트·OpenAPI OAuth 계약과 정렬한다.
 */
export const FRONTEND_OAUTH_ERROR_PATH = '/oauth/error' as const;
/** OAuth 성공 후 Set-Cookie와 함께 리다이렉트할 프론트 콜백(클라이언트 state 마킹). */
export const FRONTEND_OAUTH_SUCCESS_CALLBACK_PATH = '/oauth/callback' as const;
