/**
 * 인증 도메인 타입.
 *
 * - {@link OAuthProvider}: 백엔드가 지원하는 OAuth 공급자 식별자.
 *   `GET /api/v1/auth/:provider` 경로 파라미터에 그대로 사용된다.
 * - {@link SessionUser}: 세션 사용자 정보. `GET /api/v1/users/me` 응답과 1:1 매핑되며,
 *   {@link import('./user').UserProfile}의 별칭(alias)이다. "세션 맥락의 유저"임을
 *   이름으로 드러내기 위한 의미론적 별칭이며 shape은 동일하다.
 */

import type { UserProfile } from './user';

/** 백엔드가 지원하는 OAuth 공급자 목록 (SSOT) */
export const OAUTH_PROVIDERS = ['google', 'kakao', 'naver'] as const;

/** 백엔드가 지원하는 OAuth 공급자 */
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

/**
 * 세션 사용자 정보 — `GET /api/v1/users/me` 응답.
 * shape은 {@link UserProfile}과 동일하며, 의미론적 이름을 부여하기 위한 별칭이다.
 */
export type SessionUser = UserProfile;
