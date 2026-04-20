/**
 * 유저 프로필 API.
 *
 * 엔드포인트: `agent/backend/spec/backend_architecture_spec_producer.md` §1.1
 * - GET  /api/v1/users/me          → {@link getMyProfile}
 * - PATCH /api/v1/users/me/nickname → {@link updateMyNickname}
 *
 * 응답·요청 타입은 `@/lib/types/user`에서 정의한다.
 */

import { httpClient } from './http-client';
import { API_ENDPOINTS } from './endpoints';
import type {
  UpdateNicknameRequest,
  UpdateNicknameResponse,
  UserProfile,
} from '@/lib/types/user';

/**
 * 현재 로그인한 유저의 프로필을 조회한다.
 * JWT 쿠키가 없으면 백엔드에서 401을 반환하며 `ApiError`로 throw된다.
 */
export function getMyProfile(): Promise<UserProfile> {
  return httpClient.get<UserProfile>(API_ENDPOINTS.users.me);
}

/**
 * 닉네임을 변경한다.
 * 성공 시 변경된 `{ id, nickname }`을 반환한다.
 */
export function updateMyNickname(
  params: UpdateNicknameRequest,
): Promise<UpdateNicknameResponse> {
  return httpClient.patch<UpdateNicknameResponse>(
    API_ENDPOINTS.users.meNickname,
    params,
  );
}
