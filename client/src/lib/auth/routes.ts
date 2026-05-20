/**
 * 인증 관련 라우트 상수·헬퍼.
 *
 * - 보호 라우트 prefix: Proxy(쿠키 존재 검사)와 `ProtectedRoute`(세션 검증)가 공유하는
 *   경로 목록을 **단일 원천**으로 관리한다. 두 곳의 정의가 어긋나면 보호 누락 또는
 *   무한 리다이렉트가 발생할 수 있으므로 반드시 이 파일을 거친다.
 * - 로그인 경로 및 리다이렉트 쿼리 파라미터도 함께 관리한다.
 *
 * 값을 바꿀 때는 `app/` 라우트 그룹 구조(`(main)` 그룹 vs `(auth)` 그룹)를
 * 함께 검토해야 한다. `proxy.ts`의 `config.matcher`는 Next.js 빌드 타임 정적 분석 요구로
 * import 공유가 불가해, 동일 경로 집합을 수동으로 맞춰야 한다.
 *
 * `/mypage` 루트만 비인증 허용(SSR에서 세션 분기). `/mypage/...` 하위는 보호 대상이다.
 */

/**
 * 인증이 필요한 라우트의 path prefix 목록.
 *
 * `(main)` 중 `/chatbot`·`/inventory` 하위를 커버한다. `/mypage` 루트는 목록에 넣지 않고
 * `isProtectedPath`에서 `/mypage/...`만 별도로 보호한다.
 * 각 항목은 정확 일치 또는 `/{prefix}/...` 형태의 하위 경로까지 보호 대상이다.
 */
export const PROTECTED_PATH_PREFIXES: readonly string[] = [
  '/chatbot',
  '/inventory',
] as const;

/** 비인증 리다이렉트 목적지 */
export const LOGIN_PATH = '/login';

/** 로그인 후 복귀할 원래 경로를 담는 쿼리 파라미터 이름 */
export const NEXT_QUERY_PARAM = 'next';
/** 세션 만료 플래그 쿼리 키 */
export const SESSION_EXPIRED_QUERY_PARAM = 'sessionExpired';
/** SSR 토큰 갱신 브리지 경로 */
export const SSR_REFRESH_BRIDGE_PATH = '/api/auth/refresh-bridge';
/** SSR 토큰 갱신 재시도 플래그 쿼리 키 */
export const SSR_REFRESH_GUARD_QUERY_PARAM = 'refreshed';

/**
 * 주어진 pathname이 보호 대상인지 판별한다.
 * `/mypage`·`/mypage/` 루트만 비보호, `/mypage/...` 하위는 보호(쿠키 검사 대상).
 * 그 외는 `PROTECTED_PATH_PREFIXES`에 대해 prefix 완전 일치 또는 `/{prefix}/`로 시작하면 true.
 */
export function isProtectedPath(pathname: string): boolean {
  if (pathname === '/mypage' || pathname === '/mypage/') {
    return false;
  }
  if (pathname.startsWith('/mypage/')) {
    return true;
  }
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * 로그인 URL을 조립한다.
 * @param nextUrl 로그인 후 돌아올 원래 URL(pathname + search). 비어 있으면 쿼리 생략.
 */
export function buildLoginUrl(
  nextUrl: string | null | undefined,
  isSessionExpired: boolean = false,
): string {
  const params = new URLSearchParams();
  if (isSessionExpired) params.set(SESSION_EXPIRED_QUERY_PARAM, '1');
  if (nextUrl) params.set(NEXT_QUERY_PARAM, nextUrl);
  return `${LOGIN_PATH}?${params.toString()}`;
}

/**
 * SSR에서 401 발생 시 refresh 브리지로 이동할 URL을 조립한다.
 * 브리지는 refresh 성공 시 `next`로 복귀하고, 실패 시 로그인으로 보낸다.
 */
export function buildSsrRefreshBridgeUrl(
  nextUrl: string | null | undefined,
): string {
  const qs = new URLSearchParams();
  if (nextUrl) qs.set(NEXT_QUERY_PARAM, nextUrl);
  qs.set(SSR_REFRESH_GUARD_QUERY_PARAM, '1');
  const query = qs.toString();
  return query
    ? `${SSR_REFRESH_BRIDGE_PATH}?${query}`
    : SSR_REFRESH_BRIDGE_PATH;
}
