/**
 * API·SSE 호출 정책.
 *
 * base URL은 {@link env.apiBaseUrl}(`@/lib/config/env`)을 사용한다.
 * 소비처: `http-client.ts`, `sse-client.ts` 등.
 */

export const API_REQUEST_TIMEOUT_MS = 10_000;
export const SSE_CONNECT_TIMEOUT_MS = 15_000;
export const SSE_IDLE_TIMEOUT_MS = 30_000;

export const API_RETRY_POLICY = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 4_000,
  jitterMs: 200,
  retryableStatuses: [408, 429, 500, 502, 503, 504] as const,
} as const;

export const SSE_RETRY_POLICY = {
  maxAttempts: 4,
  baseDelayMs: 300,
  maxDelayMs: 3_000,
  jitterMs: 150,
} as const;

export type ApiRetryPolicy = typeof API_RETRY_POLICY;
export type SseRetryPolicy = typeof SSE_RETRY_POLICY;
