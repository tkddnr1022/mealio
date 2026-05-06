import type { EachMessagePayload } from 'kafkajs';
import { Logger } from '@nestjs/common';
import { SchemaValidator } from '../validation/schema.validator';

export interface TransformContext {
  /**
   * 원본 Kafka 토픽 이름.
   */
  topic: string;
  /**
   * 파티션/오프셋 등 tracing 에 사용할 수 있는 메타데이터.
   */
  partition: number;
  offset: string;
  key: string | null;
}

export interface TransformResult<T> {
  ok: boolean;
  value?: T;
  /**
   * 변환 실패 사유(로깅/모니터링용).
   */
  error?: string;
}

export type EventMapper<TInput, TOutput> = (
  input: TInput,
  context: TransformContext,
) => TOutput;

/**
 * Kafka raw message → 도메인 이벤트 → 내부 처리용 DTO 로의 변환을 담당하는 공통 유틸리티.
 * - SchemaValidator 와 조합해 사용한다.
 */
export class EventTransformer<TInput, TOutput> {
  private readonly logger: Logger;

  constructor(
    private readonly schemaValidator: SchemaValidator,
    private readonly map: EventMapper<TInput, TOutput>,
    loggerName?: string,
  ) {
    this.logger = new Logger(loggerName ?? EventTransformer.name);
  }

  transform(
    payload: EachMessagePayload,
    typeGuard: (input: unknown) => input is TInput,
  ): TransformResult<TOutput> {
    const context: TransformContext = {
      topic: payload.topic,
      partition: payload.partition,
      offset: payload.message.offset,
      key: payload.message.key?.toString() ?? null,
    };

    const event = this.schemaValidator.validateFromKafkaMessage<TInput>(
      payload,
      typeGuard,
    );

    if (!event) {
      return {
        ok: false,
        error: 'Schema validation failed or message could not be parsed',
      };
    }

    try {
      const transformed = this.map(event, context);
      return {
        ok: true,
        value: transformed,
      };
    } catch (error) {
      const message = `Failed to transform event for topic=${context.topic}, offset=${context.offset}`;
      this.logger.error(message, error as Error);
      return {
        ok: false,
        error: message,
      };
    }
  }
}
