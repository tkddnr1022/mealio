import Joi from 'joi';
import {
  sentryDsnEnvName,
  type ObservabilityServiceName,
} from './observability.config';

const metricsEnabledOn = Joi.string().valid('true', '1');

export interface ObservabilityEnvValidationOptions {
  serviceName: ObservabilityServiceName;
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
    METRICS_PORT: Joi.when('METRICS_ENABLED', {
      is: metricsEnabledOn,
      then: Joi.string().pattern(/^\d+$/).required().messages({
        'any.required': 'METRICS_PORT is required when METRICS_ENABLED=true',
      }),
      otherwise: Joi.optional(),
    }),
  };

  return rules;
}

export function isMetricsEnabledEnv(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

export function isSentryEnabledEnv(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}
