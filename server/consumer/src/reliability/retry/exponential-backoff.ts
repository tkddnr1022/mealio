export interface BackoffOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
  /** 재시도하지 않을 오류 판별. false이면 즉시 throw (재시도 없음). 미설정 시 모든 오류 재시도. */
  isRetryable?: (error: unknown) => boolean;
}

export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: BackoffOptions,
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs, onRetry, isRetryable } = options;

  let attempt = 0;
  // 첫 시도 포함하여 maxRetries + 1 번까지 시도
  // (예: maxRetries=2 → 총 3번 시도)

  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (isRetryable !== undefined && !isRetryable(error)) {
        throw error;
      }
      if (attempt >= maxRetries) {
        throw error;
      }
      const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      onRetry?.(error, attempt + 1, delay);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt += 1;
    }
  }
}
