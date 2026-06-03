/**
 * Sentry 태그·컨텍스트 키 (Producer/Consumer/Client 공통)
 */
export const SENTRY_TAG_SERVICE = 'service';
export const SENTRY_TAG_CORRELATION_ID = 'correlationId';
export const SENTRY_TAG_FEATURE = 'feature';
export const SENTRY_TAG_TOPIC = 'topic';
export const SENTRY_TAG_CONSUMER_GROUP = 'consumerGroup';
export const SENTRY_TAG_PARTITION = 'partition';
export const SENTRY_TAG_OFFSET = 'offset';

export type SentryServiceTag = 'producer' | 'consumer' | 'client';

export type SentryFeatureTag =
  | 'auth'
  | 'recipes'
  | 'ingredients'
  | 'inventory'
  | 'chatbot'
  | 'health'
  | 'metrics'
  | 'consumer'
  | 'unknown';

/** 요청/이벤트 본문에서 마스킹할 키(대소문자 무시 부분 일치) */
export const SENTRY_SENSITIVE_KEY_PATTERNS = [
  'password',
  'secret',
  'token',
  'authorization',
  'cookie',
  'set-cookie',
  'access_token',
  'refresh_token',
  'api_key',
  'apikey',
] as const;

/** HTTP 헤더에서 제거할 이름(소문자 비교) */
export const SENTRY_SENSITIVE_HEADERS = [
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
] as const;
