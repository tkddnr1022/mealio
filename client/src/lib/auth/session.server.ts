import 'server-only';

/**
 * 서버 컴포넌트·미들웨어 전용 세션 API.
 *
 * - `next/headers`의 `cookies()`로 요청 쿠키를 읽는다. 클라이언트 번들에 들어가면 런타임 에러가
 *   나므로, 본 모듈 상단의 `import 'server-only'`가 빌드 타임에 이를 보장한다.
 * - JWT 서명·만료 검증은 백엔드에 위임하며(보호 API는 401을 반환), 미들웨어 단계에서는
 *   토큰을 디코딩하지 않는다.
 * - `credentials: 'include'`는 서버 측 fetch에서 동작하지 않으므로 `Cookie` 헤더를 수동 주입한다.
 */

import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { isApiError } from '@/lib/api/error';
import { httpClient } from '@/lib/api/http-client';
import type { SessionUser } from '@/lib/types/auth';

import { REFRESH_TOKEN_COOKIE_NAME } from './session';

/**
 * 서버 컴포넌트·Route Handler에서 JWT 쿠키 존재 여부만 빠르게 확인한다.
 */
export async function hasAuthCookie(): Promise<boolean> {
  const { cookies } = await import('next/headers');
  const store = await cookies();
  const refreshToken = store.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  return typeof refreshToken === 'string' && refreshToken.length > 0;
}

/**
 * 서버 컴포넌트에서 현재 사용자를 조회한다.
 *
 * 쿠키가 없으면 API 호출을 건너뛰고 즉시 `null`을 반환하여 불필요한 라운드트립을 피한다.
 * 쿠키가 있으면 요청 쿠키를 그대로 전달해 `GET /api/v1/users/me`를 호출한다.
 */
export async function getServerSession(): Promise<SessionUser | null> {
  const { cookies } = await import('next/headers');
  const store = await cookies();
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  try {
    return await httpClient.get<SessionUser>(API_ENDPOINTS.users.me, {
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    });
  } catch (error) {
    if (isApiError(error) && error.status === 401) return null;
    throw error;
  }
}
