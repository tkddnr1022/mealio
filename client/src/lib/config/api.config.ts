/**
 * API·SSE 호출 관련 상수.
 *
 * - base URL은 {@link env.apiBaseUrl}을 단일 원천으로 한다.
 *   이 모듈은 타임아웃·재시도 등 **정책 상수**만 노출하며, URL 재노출은 하지 않는다.
 * - 타임아웃·재시도 수치는 명세(§4 성능 예산)와 챗봇 SSE 계약을 근거로 보수적으로 설정한다.
 * - 소비처: `client/src/lib/api/http-client.ts`, `client/src/lib/chatbot/sse-client.ts`,
 *   React Query 전역 기본값 등.
 */

/**
 * 일반 REST 요청 기본 타임아웃(ms).
 * 대부분의 페이지 성능 예산(초기 로드 < 2.5s)에 맞춰 보수적으로 10초로 설정한다.
 */
export const API_REQUEST_TIMEOUT_MS = 10_000;

/**
 * SSE 연결 시작까지(첫 바이트 수신까지) 허용하는 타임아웃(ms).
 * 첫 응답 지연이 이 값을 넘으면 실패로 간주하고 재시도한다.
 */
export const SSE_CONNECT_TIMEOUT_MS = 15_000;

/**
 * SSE 유휴 타임아웃(ms). 마지막 이벤트 수신 이후 이 시간 동안 `chunk`/heartbeat 없으면
 * 연결이 끊긴 것으로 간주한다. 백엔드 heartbeat 주기보다 충분히 커야 한다.
 */
export const SSE_IDLE_TIMEOUT_MS = 30_000;

/**
 * 재시도 정책.
 * - `maxAttempts`: 최초 시도를 포함한 총 시도 횟수
 * - 지수 백오프: delay = min(maxDelay, baseDelay * 2^(attempt-1)) + jitter
 * - `retryableStatuses`: HTTP 상태 코드 기준 재시도 허용 집합
 *   (네트워크 오류 = status 0은 항상 재시도 대상)
 */
export const API_RETRY_POLICY = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 4_000,
  jitterMs: 200,
  retryableStatuses: [408, 429, 500, 502, 503, 504] as const,
} as const;

/**
 * 챗봇 SSE 재연결 정책. 스트림이 `done` 이전에 끊겼을 때만 적용된다.
 * - REST 재시도보다 공격적으로(짧은 간격) 재연결을 시도해 체감 지연을 줄인다.
 */
export const SSE_RETRY_POLICY = {
  maxAttempts: 4,
  baseDelayMs: 300,
  maxDelayMs: 3_000,
  jitterMs: 150,
} as const;

export type ApiRetryPolicy = typeof API_RETRY_POLICY;
export type SseRetryPolicy = typeof SSE_RETRY_POLICY;
