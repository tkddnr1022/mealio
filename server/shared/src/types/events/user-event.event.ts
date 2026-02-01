/**
 * User 이벤트 타입 정의
 */
export enum UserEventType {
  NICKNAME_UPDATE = 'user.nickname.update',
}

export interface UserNicknameUpdateEvent {
  type: UserEventType.NICKNAME_UPDATE;
  userId: number;
  nickname: string;
  previousNickname: string;
  timestamp: string;
}

export type UserEvent = UserNicknameUpdateEvent;

export function isUserNicknameUpdateEvent(
  event: UserEvent,
): event is UserNicknameUpdateEvent {
  return event.type === UserEventType.NICKNAME_UPDATE;
}
