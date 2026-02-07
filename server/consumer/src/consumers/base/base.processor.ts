import type { EachMessagePayload } from 'kafkajs';
import { Logger } from '@nestjs/common';
import type {
  RetryStrategy,
  RetryContext,
} from 'src/consumers/base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';

/**
 * 토픽별 메시지 처리 인터페이스.
 * 단일 consumer에서 구독한 메시지를 토픽별로 디스패치할 때 사용한다.
 */
export interface ITopicProcessor {
  getTopic(): string;
  getDlqTopic(): string;
  handleMessage(payload: EachMessagePayload): Promise<void>;
}

/**
 * 토픽별 처리 로직 베이스 클래스 (파싱, 재시도, DLQ).
 * subscribe/run은 수행하지 않고, handleMessage만 제공한다.
 */
export abstract class BaseTopicProcessor<TEvent> implements ITopicProcessor {
  protected readonly logger: Logger;

  protected constructor(
    loggerName: string,
    private readonly retryStrategy: RetryStrategy,
    private readonly deadLetterHandler: DeadLetterHandler,
  ) {
    this.logger = new Logger(loggerName);
  }

  abstract getTopic(): string;
  abstract getDlqTopic(): string;

  protected abstract parseEvent(message: EachMessagePayload): TEvent | null;

  protected abstract processEvent(
    event: TEvent,
    message: EachMessagePayload,
  ): Promise<void>;

  async handleMessage(payload: EachMessagePayload): Promise<void> {
    await this.handleWithRetryAndDlq(payload, this.getDlqTopic());
  }

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
