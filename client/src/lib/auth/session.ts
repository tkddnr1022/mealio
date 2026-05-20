/**
 * 세션 공용 타입·상수.
 *
 * - 환경 중립(서버·클라이언트 모두에서 안전) 모듈이다. `next/headers` 같은 Node-only API는
 *   여기서 import하지 않는다. 그런 API는 `./session.server`에 둔다.
 * - 클라이언트 네트워크 호출은 `./session.client`에 둔다(fetchCurrentUser).
 *
 * 쿠키 이름(`accessToken`, `refreshToken`)은 OpenAPI 스펙(`agent/common/openapi_spec.yaml`)과
 * OAuth 가이드라인의 Set-Cookie 계약을 따른다.
 */

export type { SessionUser } from '@/lib/types/auth';
import { env } from '@/lib/config/env';

/** 백엔드가 발급하는 Access Token HttpOnly 쿠키 이름 */
export const ACCESS_TOKEN_COOKIE_NAME = env.authCookieName;
/** 백엔드가 발급하는 Refresh Token HttpOnly 쿠키 이름 */
export const REFRESH_TOKEN_COOKIE_NAME = env.refreshCookieName;

// 기존 호환 re-export — 신규 코드는 `./session.client` / `./session.server`에서 직접 가져오는 것을 권장.
export { fetchCurrentUser } from './session.client';
