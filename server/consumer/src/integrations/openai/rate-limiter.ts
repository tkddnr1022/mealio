import { Injectable } from '@nestjs/common';
import { DEFAULT_OPENAI_RATE_LIMIT_RPM } from '../../policy/openai.policy';

/**
 * OpenAI API 호출 제한 (분당 요청 수 제한)
 * 인메모리 슬라이딩 윈도우 방식. 단일 인스턴스 기준.
 */
@Injectable()
export class OpenAIRateLimiter {
  private readonly timestamps: number[] = [];
  private readonly maxRequestsPerMinute: number;

  constructor(maxRequestsPerMinute = DEFAULT_OPENAI_RATE_LIMIT_RPM) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
  }

  /**
   * 호출 전 대기. 제한 초과 시 다음 슬롯까지 대기 후 resolve.
   */
  async acquire(): Promise<void> {
    const now = Date.now();
    const windowStart = now - 60_000;
    this.prune(windowStart);

    if (this.timestamps.length >= this.maxRequestsPerMinute) {
      const oldest = this.timestamps[0];
      const waitMs = oldest + 60_000 - now;
      if (waitMs > 0) {
        await this.sleep(waitMs);
      }
      return this.acquire();
    }

    this.timestamps.push(Date.now());
  }

  private prune(olderThan: number): void {
    while (this.timestamps.length > 0 && this.timestamps[0] < olderThan) {
      this.timestamps.shift();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
