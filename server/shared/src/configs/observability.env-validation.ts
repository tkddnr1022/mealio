import Joi from 'joi';

const metricsEnabledOn = Joi.string().valid('true', '1');

const sampleRateSchema = Joi.string()
  .required()
  .custom((value: string, helpers) => {
    const parsed = parseFloat(value);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
      return helpers.error('any.invalid');
    }
    return value;
  })
  .messages({
    'any.invalid': 'must be a number between 0 and 1',
    'any.required': 'is required when METRICS_ENABLED=true',
  });

export interface ObservabilityEnvValidationOptions {
  /** Consumer는 METRICS_PORT 필수, Producer는 HTTP PORT로 /metrics 노출 */
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
    SENTRY_DSN: Joi.string().uri().optional().allow(''),
    SLOW_QUERY_THRESHOLD_MS: Joi.when('METRICS_ENABLED', {
      is: metricsEnabledOn,
      then: Joi.string()
        .pattern(/^\d+$/)
        .required()
        .messages({
          'any.required':
            'SLOW_QUERY_THRESHOLD_MS is required when METRICS_ENABLED=true',
        }),
      otherwise: Joi.optional(),
    }),
    LOG_SAMPLE_RATE: Joi.when('METRICS_ENABLED', {
      is: metricsEnabledOn,
      then: sampleRateSchema,
      otherwise: Joi.optional(),
    }),
    TRACE_SAMPLE_RATE: Joi.when('METRICS_ENABLED', {
      is: metricsEnabledOn,
      then: sampleRateSchema,
      otherwise: Joi.optional(),
    }),
  };

  if (options.requireMetricsPort) {
    rules.METRICS_PORT = Joi.when('METRICS_ENABLED', {
      is: metricsEnabledOn,
      then: Joi.string()
        .pattern(/^\d+$/)
        .required()
        .messages({
          'any.required': 'METRICS_PORT is required when METRICS_ENABLED=true',
        }),
      otherwise: Joi.optional(),
    });
  }

  return rules;
}

export function isMetricsEnabledEnv(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}
