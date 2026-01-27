/**
 * User 이벤트 타입 정의
 * Kafka USER_EVENTS 토픽에서 사용되는 이벤트 페이로드 타입
 */

/**
 * User 이벤트 타입 enum
 */
export enum UserEventType {
  NICKNAME_UPDATE = 'user.nickname.update',
  // 향후 확장 가능한 이벤트 타입들
  // SIGNUP = 'user.signup',
  // LOGIN = 'user.login',
  // PROFILE_UPDATE = 'user.profile.update',
}

/**
 * User 닉네임 업데이트 이벤트 페이로드
 */
export interface UserNicknameUpdateEvent {
  type: UserEventType.NICKNAME_UPDATE;
  userId: number;
  nickname: string;
  previousNickname: string;
  timestamp: string; // ISO 8601 형식
}

/**
 * User 이벤트 유니온 타입
 * 모든 User 이벤트 타입을 포함
 */
export type UserEvent = UserNicknameUpdateEvent;

/**
 * User 이벤트 타입 가드
 */
export function isUserNicknameUpdateEvent(
  event: UserEvent,
): event is UserNicknameUpdateEvent {
  return event.type === UserEventType.NICKNAME_UPDATE;
}
