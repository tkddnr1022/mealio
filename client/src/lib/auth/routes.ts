/**
 * 인증 관련 라우트 상수·헬퍼.
 *
 * - 보호 라우트 prefix: 미들웨어(쿠키 존재 검사)와 `ProtectedRoute`(세션 검증)가 공유하는
 *   경로 목록을 **단일 원천**으로 관리한다. 두 곳의 정의가 어긋나면 보호 누락 또는
 *   무한 리다이렉트가 발생할 수 있으므로 반드시 이 파일을 거친다.
 * - 로그인 경로 및 리다이렉트 쿼리 파라미터도 함께 관리한다.
 *
 * 값을 바꿀 때는 `app/` 라우트 그룹 구조(`(main)` 그룹 vs `(auth)` 그룹)와
 * `client/src/middleware.ts`의 `config.matcher`(정적/빌드 타임 설정)를
 * 같이 갱신해야 한다는 점에 주의한다.
 */

/**
 * 인증이 필요한 라우트의 path prefix 목록.
 *
 * `(main)` 그룹(`/recipe`·`/chatbot`·`/inventory`·`/mypage`)을 커버한다.
 * 각 항목은 정확 일치 또는 `/{prefix}/...` 형태의 하위 경로까지 보호 대상이다.
 */
export const PROTECTED_PATH_PREFIXES: readonly string[] = [
  '/recipe',
  '/chatbot',
  '/inventory',
  '/mypage',
] as const;

/**
 * Next.js 미들웨어 `config.matcher` 패턴.
 *
 * Next.js는 빌드 타임에 `config`를 정적 분석하므로 {@link PROTECTED_PATH_PREFIXES}로
 * 런타임에 파생된 값은 사용할 수 없다. 두 값을 반드시 같은 경로 집합으로 유지할 것.
 */
export const MIDDLEWARE_MATCHER: readonly string[] = [
  '/recipe/:path*',
  '/chatbot/:path*',
  '/inventory/:path*',
  '/mypage/:path*',
] as const;

/** 비인증 리다이렉트 목적지 */
export const LOGIN_PATH = '/login';

/** 로그인 후 복귀할 원래 경로를 담는 쿼리 파라미터 이름 */
export const NEXT_QUERY_PARAM = 'next';

/**
 * 주어진 pathname이 보호 대상인지 판별한다.
 * prefix 완전 일치 또는 `/{prefix}/`로 시작하는 하위 경로를 포함한다.
 */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * 로그인 URL을 조립한다.
 * @param nextUrl 로그인 후 돌아올 원래 URL(pathname + search). 비어 있으면 쿼리 생략.
 */
export function buildLoginUrl(nextUrl: string | null | undefined): string {
  if (!nextUrl) return LOGIN_PATH;
  return `${LOGIN_PATH}?${NEXT_QUERY_PARAM}=${encodeURIComponent(nextUrl)}`;
}
