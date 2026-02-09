/**
 * Activity 이벤트 타입 정의.
 * activity-events 토픽 페이로드 (레시피/검색 활동 EventLog 기록용).
 * - recipe.view, recipe.like, recipe.share, search.query, search.click
 */
export enum ActivityEventType {
  RECIPE_VIEW = 'recipe.view',
  RECIPE_LIKE = 'recipe.like',
  RECIPE_SHARE = 'recipe.share',
  SEARCH_QUERY = 'search.query',
  SEARCH_CLICK = 'search.click',
}

export const ACTIVITY_EVENT_TYPES: ActivityEventType[] = [
  ...Object.values(ActivityEventType),
];

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

export interface RecipeViewEvent {
  type: ActivityEventType.RECIPE_VIEW;
  actor: ActivityEventActor;
  entity?: ActivityEventEntity;
  payload?: Record<string, unknown>;
  metadata?: ActivityEventMetadata;
}

export interface RecipeLikeEvent {
  type: ActivityEventType.RECIPE_LIKE;
  actor: ActivityEventActor;
  entity?: ActivityEventEntity;
  payload?: Record<string, unknown>;
  metadata?: ActivityEventMetadata;
}

export interface RecipeShareEvent {
  type: ActivityEventType.RECIPE_SHARE;
  actor: ActivityEventActor;
  entity?: ActivityEventEntity;
  payload?: Record<string, unknown>;
  metadata?: ActivityEventMetadata;
}

export interface SearchQueryEvent {
  type: ActivityEventType.SEARCH_QUERY;
  actor: ActivityEventActor;
  entity?: ActivityEventEntity;
  payload?: Record<string, unknown>;
  metadata?: ActivityEventMetadata;
}

export interface SearchClickEvent {
  type: ActivityEventType.SEARCH_CLICK;
  actor: ActivityEventActor;
  entity?: ActivityEventEntity;
  payload?: Record<string, unknown>;
  metadata?: ActivityEventMetadata;
}

export type ActivityEvent =
  | RecipeViewEvent
  | RecipeLikeEvent
  | RecipeShareEvent
  | SearchQueryEvent
  | SearchClickEvent;

/** @deprecated ActivityEvent 사용 권장 */
export type ActivityEventPayload = ActivityEvent;

export function isActivityEventType(
  type: string,
): type is ActivityEventType {
  return (ACTIVITY_EVENT_TYPES as readonly string[]).includes(
    type as ActivityEventType,
  );
}

export function isActivityEvent(obj: unknown): obj is ActivityEvent {
  const o = obj as Record<string, unknown>;
  return (
    o != null &&
    typeof o === 'object' &&
    'type' in o &&
    typeof o.type === 'string' &&
    isActivityEventType(o.type) &&
    'actor' in o &&
    typeof o.actor === 'object'
  );
}
