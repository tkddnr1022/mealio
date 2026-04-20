/**
 * 사용자 도메인 타입.
 *
 * 백엔드 `UserDto` / `UpdateNicknameDto` 응답·요청과 1:1 대응한다.
 */

/** `GET /api/v1/users/me` 응답 */
export interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  /** ISO 8601 */
  createdAt: string;
}

/** `PATCH /api/v1/users/me/nickname` 요청 body */
export interface UpdateNicknameRequest {
  nickname: string;
}

/** `PATCH /api/v1/users/me/nickname` 응답 */
export interface UpdateNicknameResponse {
  id: number;
  nickname: string;
}
