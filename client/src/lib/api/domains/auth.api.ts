/**
 * 인증 API (로그아웃 등).
 *
 * OAuth 진입은 {@link buildOAuthEntryUrl} 사용. 엔드포인트는 OpenAPI
 * `POST /api/v1/auth/logout` 과 일치한다.
 */

import { httpClient, type RequestOptions } from '../http-client';
import { API_ENDPOINTS } from '../endpoints';

/**
 * 로그아웃한다. 성공 시 204이며 응답 본문은 없다.
 */
export function logout(fetchOptions?: RequestOptions): Promise<void> {
  return httpClient.post<void>(
    API_ENDPOINTS.auth.logout,
    undefined,
    fetchOptions,
  );
}
