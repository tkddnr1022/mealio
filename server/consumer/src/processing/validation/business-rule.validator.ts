import { Logger } from '@nestjs/common';

export interface BusinessRuleViolation {
  code: string;
  message: string;
  detail?: Record<string, unknown>;
}

export interface BusinessRuleValidationResult {
  ok: boolean;
  violations: BusinessRuleViolation[];
}

export type BusinessRule<T> = (event: T) => BusinessRuleViolation | null;

export interface BusinessRuleValidatorOptions {
  name?: string;
  /**
   * 비즈니스 규칙 위반 시 예외를 던질지 여부.
   * - true: 첫 위반 발생 시 예외 발생 → 상위에서 재시도/ DLQ 로직 수행
   * - false: 단순 경고 로깅 후 이벤트 처리는 진행
   */
  throwOnViolation?: boolean;
}

/**
 * 스키마 검증(JSON 구조/타입) 이후의 도메인 비즈니스 규칙 검증을 담당하는 유틸리티.
 * 예: userId > 0, 금지된 이벤트 타입 필터링 등.
 */
export class BusinessRuleValidator<T> {
  private readonly logger: Logger;

  constructor(
    private readonly rules: BusinessRule<T>[],
    private readonly options: BusinessRuleValidatorOptions = {},
  ) {
    this.logger = new Logger(options.name ?? BusinessRuleValidator.name);
  }

  validate(event: T): BusinessRuleValidationResult {
    const violations: BusinessRuleViolation[] = [];

    for (const rule of this.rules) {
      const violation = rule(event);
      if (violation) {
        violations.push(violation);
        if (this.options.throwOnViolation) {
          this.logger.warn(
            `Business rule violated${
              this.options.name ? ` in ${this.options.name}` : ''
            }: ${violation.code} - ${violation.message}`,
          );
          const error = new Error(violation.message);
          // Nest Logger에 남기고 상위 재시도/ DLQ 로직으로 위임
          this.logger.error(error.message, error);
          throw error;
        }
      }
    }

    if (violations.length > 0) {
      this.logger.warn(
        `Business rule violations${
          this.options.name ? ` in ${this.options.name}` : ''
        }: ${violations.map((v) => v.code).join(', ')}`,
      );
    }

    return {
      ok: violations.length === 0,
      violations,
    };
  }
}

