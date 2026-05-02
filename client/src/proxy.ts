import { NextResponse, type NextRequest } from 'next/server';

import {
  LOGIN_PATH,
  NEXT_QUERY_PARAM,
  isProtectedPath,
} from '@/lib/auth/routes';
import { AUTH_COOKIE_NAME } from '@/lib/auth/session';

/**
 * Next.js Proxy.
 *
 * `(main)` 그룹(`/chatbot`, `/inventory`, `/mypage` 및 하위 경로) 접근 시
 * JWT 쿠키 존재 여부를 검사해 미인증 사용자를 `/login`으로 리다이렉트한다.
 *
 * 쿠키 존재 = "인증됨"으로 가정하는 낙관적 검사이며, 실제 토큰의 유효성·만료는
 * 백엔드와 `ProtectedRoute`의 `GET /api/v1/users/me` 호출에서 2차로 검증한다.
 *
 * 보호 경로 정의는 `@/lib/auth/routes`에 단일 원천으로 관리되며, `ProtectedRoute`도
 * 동일한 상수를 공유한다. `matcher`는 Next.js 빌드 타임 정적 분석 요구로 리터럴 배열을
 * 사용하지만, 라우트 상수와 같은 경로 집합이어야 한다.
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (token && token.length > 0) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  loginUrl.search = '';
  loginUrl.searchParams.set(NEXT_QUERY_PARAM, `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

/**
 * Proxy 적용 범위.
 *
 * - `(main)` 그룹 하위 경로(`/chatbot`·`/inventory`·`/mypage`)만 매칭한다.
 * - `/api`, `/_next`, 정적 파일(`/favicon.ico`, 이미지 등)과 `(auth)`·`(marketing)`
 *   그룹에 해당하는 URL(`/login`, `/signup`, `/oauth/error`, `/`, `/about`,
 *   `/pricing`)은 matcher 자체에서 제외되어 불필요한 실행을 피한다.
 */
export const config = {
  // Next.js 빌드 정적 분석 제약으로 matcher는 이 파일에 리터럴로 선언해야 한다.
  matcher: ['/chatbot/:path*', '/inventory/:path*', '/mypage/:path*'],
};
