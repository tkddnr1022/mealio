/**
 * API 레이트 리밋 정책 (Redis 고정 윈도우).
 */
export const RATE_LIMIT_WINDOW_SECONDS = 60;
export const RATE_LIMIT_MAX_REQUESTS_PER_WINDOW = 100;

/** Next.js SSR·빌드 등 `INTERNAL_API_SECRET` 인증 트래픽 전용 */
export const INTERNAL_RATE_LIMIT_WINDOW_SECONDS = 60;
export const INTERNAL_RATE_LIMIT_MAX_REQUESTS_PER_WINDOW = 500;
