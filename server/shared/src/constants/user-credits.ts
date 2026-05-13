/**
 * 챗봇 크레딧 기본 정책 (신규 사용자·시드·`UserRepository.create`와 동일 기준).
 * Prisma/DB 기본값은 0이며, 실제 초기 잔액은 행 생성 시 이 상수로 설정한다.
 */
export const DEFAULT_USER_CREDIT_BALANCE = 1000;
export const DEFAULT_USER_CREDIT_MONTHLY_LIMIT = 1000;
export const TOKENS_PER_CREDIT = 30;

/**
 * 토큰 사용량으로 차감 크레딧을 계산한다.
 * - 기본 1크레딧/턴 + totalTokens 5000당 1크레딧(올림)
 */
export function computeChatbotCreditCost(usage?: {
  totalTokens: number;
}): number {
  const base = 1;
  const tokens = usage?.totalTokens ?? 0;
  if (tokens <= 0) return base;
  return base + Math.ceil(tokens / TOKENS_PER_CREDIT);
}
