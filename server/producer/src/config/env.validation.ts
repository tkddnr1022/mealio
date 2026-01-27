import Joi from 'joi';

/**
 * 앱 시작 시 환경 변수 검증 스키마
 * 검증 실패 시 구동을 중단하고 오류 메시지를 출력한다.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.string()
    .pattern(/^\d+$/)
    .default('3000'),

  JWT_SECRET: Joi.string().min(1).required().messages({
    'string.empty': 'JWT_SECRET must not be empty',
    'any.required': 'JWT_SECRET is required',
  }),

  MONGODB_URL: Joi.string().min(1).required().messages({
    'string.empty': 'MONGODB_URL must not be empty',
    'any.required': 'MONGODB_URL is required',
  }),

  POSTGRESQL_URL: Joi.string().min(1).required().messages({
    'string.empty': 'POSTGRESQL_URL must not be empty',
    'any.required': 'POSTGRESQL_URL is required',
  }),

  KAFKA_BROKERS: Joi.string()
    .default('localhost:9092')
    .messages({
      'string.empty': 'KAFKA_BROKERS must not be empty when provided',
    }),

  KAFKA_CLIENT_ID: Joi.string()
    .default('cook-producer')
    .messages({
      'string.empty': 'KAFKA_CLIENT_ID must not be empty when provided',
    }),

  REDIS_URL: Joi.string()
    .default('redis://localhost:6379')
    .messages({
      'string.empty': 'REDIS_URL must not be empty when provided',
    }),
});

export const envValidationOptions = {
  allowUnknown: true,
  abortEarly: false,
} as const;
