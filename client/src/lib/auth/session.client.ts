/**
 * 클라이언트 전용 세션 API.
 *
 * 브라우저에서 `GET /api/v1/users/me`로 현재 세션을 검증한다. HttpOnly JWT 쿠키는 JS에서
 * 직접 읽을 수 없으므로, 유일한 신뢰 가능한 확인 경로는 API 호출이다.
 *
 * 401(비로그인)은 `null`로 정규화하며, 그 외 오류는 `ApiError`로 re-throw된다.
 */

import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { isApiError } from '@/lib/api/error';
import { httpClient } from '@/lib/api/http-client';
import type { SessionUser } from '@/lib/types/auth';

export async function fetchCurrentUser(
  options: { signal?: AbortSignal } = {},
): Promise<SessionUser | null> {
  try {
    return await httpClient.get<SessionUser>(API_ENDPOINTS.users.me, {
      signal: options.signal,
    });
  } catch (error) {
    if (isApiError(error) && error.status === 401) return null;
    throw error;
  }
}
