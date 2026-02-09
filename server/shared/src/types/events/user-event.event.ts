/**
 * User 이벤트 타입 정의.
 * schema.md EventLog type 및 user-events 토픽 페이로드와 정합.
 * - signup, login: EventLog enum 기준 (user.signup/user.login이 아닌 signup/login)
 */
export enum UserEventType {
  SIGNUP = 'signup',
  LOGIN = 'login',
  NICKNAME_UPDATE = 'nickname.update',
}

export const USER_EVENT_TYPES: UserEventType[] = [
  ...Object.values(UserEventType),
];

export interface UserSignupEvent {
  type: UserEventType.SIGNUP;
  userId: number;
  /** OAuth provider 등 (optional) */
  provider?: string;
  timestamp?: string;
}

export interface UserLoginEvent {
  type: UserEventType.LOGIN;
  userId: number;
  /** OAuth provider 등 (optional) */
  provider?: string;
  timestamp?: string;
}

export interface UserNicknameUpdateEvent {
  type: UserEventType.NICKNAME_UPDATE;
  userId: number;
  nickname: string;
  previousNickname?: string;
  timestamp?: string;
}

export type UserEvent =
  | UserSignupEvent
  | UserLoginEvent
  | UserNicknameUpdateEvent;

export function isUserEvent(obj: unknown): obj is UserEvent {
  const o = obj as Record<string, unknown>;
  return (
    'type' in o &&
    typeof o.type === 'string' &&
    USER_EVENT_TYPES.includes(o.type as UserEventType)
  );
}
