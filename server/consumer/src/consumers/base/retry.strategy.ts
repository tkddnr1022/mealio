import { Injectable, Logger } from '@nestjs/common';
import { BackoffOptions, withExponentialBackoff } from 'src/reliability/retry/exponential-backoff';

export interface RetryContext extends Partial<BackoffOptions> {
  operationName?: string;
  /** 재시도하지 않을 오류 판별. false이면 즉시 throw. */
  isRetryable?: (error: unknown) => boolean;
}

/**
 * 공통 재시도 전략 (지수 백오프)
 * - 각 Consumer에서 주입받아 사용
 */
@Injectable()
export class RetryStrategy {
  private readonly logger = new Logger(RetryStrategy.name);

  async execute<T>(fn: () => Promise<T>, context: RetryContext): Promise<T> {
    const options: BackoffOptions = {
      maxRetries: context.maxRetries ?? 2,
      baseDelayMs: context.baseDelayMs ?? 500,
      maxDelayMs: context.maxDelayMs ?? 5_000,
      onRetry: (error, attempt, delayMs) => {
        const op = context.operationName ?? 'operation';
        this.logger.warn(
          `Retrying ${op} (attempt=${attempt}, delay=${delayMs}ms): ${
            (error as Error).message
          }`,
        );
      },
      isRetryable: context.isRetryable,
    };

    return withExponentialBackoff(fn, options);
  }
}

