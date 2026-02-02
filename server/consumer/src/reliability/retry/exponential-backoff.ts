export interface BackoffOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: BackoffOptions,
): Promise<T> {
  const { maxRetries, baseDelayMs, maxDelayMs, onRetry } = options;

  let attempt = 0;
  // 첫 시도 포함하여 maxRetries + 1 번까지 시도
  // (예: maxRetries=2 → 총 3번 시도)
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn();
    } catch (error) {
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

