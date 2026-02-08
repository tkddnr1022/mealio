/**
 * User 이벤트 타입 정의
 */
export enum UserEventType {
  NICKNAME_UPDATE = 'nickname.update',
}

export const USER_EVENT_TYPES: UserEventType[] = [
  ...Object.values(UserEventType),
];

export interface UserNicknameUpdateEvent {
  type: UserEventType.NICKNAME_UPDATE;
  userId: number;
  nickname: string;
  previousNickname: string;
  timestamp: string;
}

export type UserEvent = UserNicknameUpdateEvent;

export function isUserEvent(obj: unknown): obj is UserEvent {
  const o = obj as Record<string, unknown>;
  return (
    'type' in o &&
    typeof o.type === 'string' &&
    USER_EVENT_TYPES.includes(o.type as UserEventType)
  );
}
