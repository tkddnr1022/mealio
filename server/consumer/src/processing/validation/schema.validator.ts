import type { EachMessagePayload } from 'kafkajs';
import { Logger } from '@nestjs/common';

export interface ValidationResult<T> {
  ok: boolean;
  value?: T;
  errors?: string[];
}

export type Predicate<T> = (input: unknown) => input is T;

export interface SchemaValidatorOptions {
  name?: string;
  /**
   * JSON 파싱 실패 등 하드 실패 시에도 DLQ로 보내지 않고 단순 스킵만 할지 여부.
   * 기본값은 false 이며, 대부분의 이벤트는 DLQ로 보내는 것이 맞다.
   */
  skipOnParseError?: boolean;
}

/**
 * Kafka 메시지 payload(JSON string)를 도메인 이벤트 타입으로 검증하는 공통 유틸리티.
 * 개별 Processor에서 반복되던 JSON.parse + 타입 가드 패턴을 캡슐화한다.
 */
export class SchemaValidator {
  private readonly logger: Logger;

  constructor(private readonly options: SchemaValidatorOptions = {}) {
    this.logger = new Logger(options.name ?? SchemaValidator.name);
  }

  /**
   * Kafka 메시지를 파싱하고, 주어진 타입 가드로 스키마 검증을 수행한다.
   * - 유효하지 않으면 null을 반환하고, BaseTopicProcessor 레벨에서 스킵되도록 한다.
   * - 필요 시 errors 배열을 활용해 추가 로깅을 할 수 있다.
   */
  validateFromKafkaMessage<T>(
    payload: EachMessagePayload,
    predicate: Predicate<T>,
  ): T | null {
    const raw = payload.message.value?.toString();
    if (!raw) {
      this.logger.warn('Message has no value. Skipping.');
      return null;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch (error) {
      const msg = `Failed to parse message as JSON: ${(error as Error).message}`;
      if (this.options.skipOnParseError) {
        this.logger.warn(msg);
        return null;
      }
      this.logger.error(msg, error as Error);
      return null;
    }

    const result = this.validate(parsed, predicate);
    if (!result.ok) {
      this.logger.warn(
        `Schema validation failed${
          this.options.name ? ` for ${this.options.name}` : ''
        }: ${result.errors?.join(', ') ?? 'unknown error'}`,
      );
      return null;
    }

    return result.value ?? null;
  }

  /**
   * 단순 타입 가드 기반 스키마 검증.
   * 필요하면 이후 Zod 등으로 확장 가능하도록 인터페이스를 좁게 유지한다.
   */
  validate<T>(input: unknown, predicate: Predicate<T>): ValidationResult<T> {
    if (!predicate(input)) {
      return {
        ok: false,
        errors: ['Predicate returned false'],
      };
    }

    return {
      ok: true,
      value: input,
    };
  }
}
