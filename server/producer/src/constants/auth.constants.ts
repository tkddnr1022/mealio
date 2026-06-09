/**
 * OAuth 프론트 리다이렉트 경로 (Producer SSOT).
 *
 * `FRONTEND_APP_BASE_URL`과 조합해 성공·실패 302 목적지를 만든다.
 * Client `(auth)/oauth/error` 라우트·OpenAPI OAuth 계약과 정렬한다.
 */
export const FRONTEND_OAUTH_ERROR_PATH = '/oauth/error' as const;
export const FRONTEND_OAUTH_DEFAULT_SUCCESS_PATH = '/recipe' as const;
