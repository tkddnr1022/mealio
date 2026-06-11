import Joi from 'joi';
import {
  sentryDsnEnvName,
  type ObservabilityServiceName,
} from './observability.config';

const metricsEnabledOn = Joi.string().valid('true', '1');

export interface ObservabilityEnvValidationOptions {
  serviceName: ObservabilityServiceName;
  /** Consumer는 CONSUMER_METRICS_PORT 필수, Producer는 PRODUCER_PORT로 /metrics 노출 */
  requireMetricsPort: boolean;
}

/**
 * METRICS_ENABLED=true 일 때 ObservabilityConfig에 필요한 env를 Joi로 검증한다.
 */
export function buildObservabilityEnvRules(
  options: ObservabilityEnvValidationOptions,
): Record<string, Joi.Schema> {
  const rules: Record<string, Joi.Schema> = {
    METRICS_ENABLED: Joi.string()
      .valid('true', 'false', '1', '0')
      .required()
      .messages({
        'any.required': 'METRICS_ENABLED is required',
        'any.only': 'METRICS_ENABLED must be true, false, 1, or 0',
      }),
    SENTRY_ENABLED: Joi.string()
      .valid('true', 'false', '1', '0')
      .required()
      .messages({
        'any.required': 'SENTRY_ENABLED is required',
        'any.only': 'SENTRY_ENABLED must be true, false, 1, or 0',
      }),
    [sentryDsnEnvName(options.serviceName)]: Joi.string()
      .uri()
      .optional()
      .allow(''),
    SLOW_QUERY_THRESHOLD_MS: Joi.when('METRICS_ENABLED', {
      is: metricsEnabledOn,
      then: Joi.string().pattern(/^\d+$/).required().messages({
        'any.required':
          'SLOW_QUERY_THRESHOLD_MS is required when METRICS_ENABLED=true',
      }),
      otherwise: Joi.optional(),
    }),
  };

  if (options.requireMetricsPort) {
    rules.CONSUMER_METRICS_PORT = Joi.when('METRICS_ENABLED', {
      is: metricsEnabledOn,
      then: Joi.string().pattern(/^\d+$/).required().messages({
        'any.required':
          'CONSUMER_METRICS_PORT is required when METRICS_ENABLED=true',
      }),
      otherwise: Joi.optional(),
    });
  }

  return rules;
}

export function isMetricsEnabledEnv(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

export function isSentryEnabledEnv(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}
