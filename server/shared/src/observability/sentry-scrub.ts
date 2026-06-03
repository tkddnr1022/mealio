import {
  SENTRY_SENSITIVE_HEADERS,
  SENTRY_SENSITIVE_KEY_PATTERNS,
} from '../constants/sentry.constants';

const REDACTED = '[Filtered]';

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENTRY_SENSITIVE_KEY_PATTERNS.some((pattern) =>
    lower.includes(pattern),
  );
}

/** 임의 객체/배열에서 민감 키를 마스킹한다. */
export function scrubObject(value: unknown): unknown {
  return scrubValue(value, 0);
}

function scrubValue(value: unknown, depth: number): unknown {
  if (depth > 8) return REDACTED;
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    if (value.length > 2048) return `${value.slice(0, 2048)}…`;
    return value;
  }
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => scrubValue(item, depth + 1));
  }
  const record = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(record)) {
    out[key] = isSensitiveKey(key) ? REDACTED : scrubValue(val, depth + 1);
  }
  return out;
}

function scrubHeaders(
  headers: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!headers) return headers;
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(headers)) {
    out[key] = SENTRY_SENSITIVE_HEADERS.includes(
      key.toLowerCase() as (typeof SENTRY_SENSITIVE_HEADERS)[number],
    )
      ? REDACTED
      : val;
  }
  return out;
}

/**
 * Sentry beforeSend 훅에서 이벤트 본문·헤더의 민감 필드를 마스킹한다.
 */
export function scrubSentryEvent<T extends { request?: unknown }>(event: T): T {
  const cloned = { ...event } as T & {
    request?: {
      headers?: Record<string, string>;
      data?: unknown;
      cookies?: unknown;
      query_string?: unknown;
    };
  };

  if (!cloned.request || typeof cloned.request !== 'object') {
    return cloned;
  }

  const req = cloned.request as {
    headers?: Record<string, string>;
    data?: unknown;
    cookies?: unknown;
    query_string?: unknown;
  };

  cloned.request = {
    ...req,
    headers: scrubHeaders(req.headers),
    data: scrubValue(req.data, 0),
    cookies: scrubValue(req.cookies, 0),
    query_string: scrubValue(req.query_string, 0),
  };

  return cloned;
}
