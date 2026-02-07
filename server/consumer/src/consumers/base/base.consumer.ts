import type { EachMessagePayload } from 'kafkajs';
import { Logger } from '@nestjs/common';
import type {
  RetryStrategy,
  RetryContext,
} from 'src/consumers/base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';

/**
 * Kafka Consumer 공통 로직 베이스 클래스
 * - 메시지 파싱
 * - 재시도 전략 적용
 * - DLQ 전송
 *
 * 각 도메인 Consumer는 이 클래스를 상속하고
 * `parseEvent` / `processEvent` / `getTopic` 을 구현한다.
 */
export abstract class BaseConsumer<TEvent> {
  protected readonly logger: Logger;

  protected constructor(
    loggerName: string,
    private readonly retryStrategy: RetryStrategy,
    private readonly deadLetterHandler: DeadLetterHandler,
  ) {
    this.logger = new Logger(loggerName);
  }

  protected abstract getTopic(): string;

  protected abstract parseEvent(message: EachMessagePayload): TEvent | null;

  protected abstract processEvent(
    event: TEvent,
    message: EachMessagePayload,
  ): Promise<void>;

  /**
   * 각 Consumer에서 `eachMessage` 내에서 호출하는 공통 처리 진입점
   */
  protected async handleWithRetryAndDlq(
    payload: EachMessagePayload,
    dlqTopic: string,
    retryContext?: RetryContext,
  ): Promise<void> {
    const { message } = payload;

    if (!message.value) {
      this.logger.warn('Received message without value, skipping');
      return;
    }

    const event = this.parseEvent(payload);
    if (!event) {
      this.logger.warn('Failed to parse event. Skipping message.');
      return;
    }

    try {
      await this.retryStrategy.execute(
        () => this.processEvent(event, payload),
        {
          operationName: `${this.getTopic()}#processEvent`,
          ...retryContext,
        },
      );
    } catch (error) {
      this.logger.error(
        `Error while processing event for topic=${this.getTopic()}`,
        error as Error,
      );

      await this.deadLetterHandler.send({
        topic: dlqTopic,
        partition: payload.partition,
        offset: message.offset,
        key: message.key?.toString() ?? null,
        value: message.value.toString(),
        reason: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
