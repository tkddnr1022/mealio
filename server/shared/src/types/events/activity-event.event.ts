/**
 * activity-events 토픽 페이로드.
 * 비로그인 유저 포함 레시피/검색 활동을 EventLog에 기록하기 위한 이벤트.
 * - recipe.view, recipe.like, recipe.share
 * - search.query, search.click
 */
export const ACTIVITY_EVENT_TYPES = [
  'recipe.view',
  'recipe.like',
  'recipe.share',
  'search.query',
  'search.click',
] as const;

export type ActivityEventType = (typeof ACTIVITY_EVENT_TYPES)[number];

export interface ActivityEventActor {
  type: 'user' | 'system' | 'admin';
  userId?: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface ActivityEventEntity {
  type: string;
  id: number;
  name?: string;
}

export interface ActivityEventMetadata {
  platform?: string;
  version?: string;
  source?: string;
  referrer?: string;
  extra?: Record<string, unknown>;
}

export interface ActivityEventPayload {
  type: ActivityEventType;
  actor: ActivityEventActor;
  entity?: ActivityEventEntity;
  payload?: Record<string, unknown>;
  metadata?: ActivityEventMetadata;
}

export function isActivityEventType(
  type: string,
): type is ActivityEventType {
  return (ACTIVITY_EVENT_TYPES as readonly string[]).includes(type);
}
