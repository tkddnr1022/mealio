/**
 * `/oauth/error` 페이지 쿼리 파라미터 계약.
 * 백엔드 `buildOAuthFailureRedirectUrl`·OAuth 표준 `error` / `error_description`과 정렬한다.
 */
export const OAUTH_ERROR_QUERY_PARAM = 'error';
export const OAUTH_ERROR_DESCRIPTION_QUERY_PARAM = 'error_description';

export const BACKEND_ERROR_CODE_QUERY_PARAMS = [
  'errorCode',
  'error_code',
] as const;
export const BACKEND_ERROR_MESSAGE_QUERY_PARAMS = [
  'errorMessage',
  'error_message',
] as const;
