/**
 * Next.js SSR·빌드 등 내부 API 트래픽 식별 헤더 (Producer SSOT).
 *
 * Client는 `client/src/lib/constants/internal-api.constants.ts`에서 동일 문자열을 유지한다.
 * 값은 환경 변수 `INTERNAL_API_SECRET`과 timing-safe 비교한다.
 */
export const INTERNAL_API_SECRET_HEADER = 'X-Internal-Api-Secret' as const;
