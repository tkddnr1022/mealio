/**
 * Next.js SSR·빌드 등 내부 API 트래픽 식별 헤더.
 *
 * Producer `server/producer/src/constants/internal-api.constants.ts`와 동일 문자열을 유지한다.
 */
export const INTERNAL_API_SECRET_HEADER = 'X-Internal-Api-Secret' as const;
