import Joi from 'joi';
import { buildObservabilityEnvRules } from '@mealio/shared';

/**
 * Consumer 앱 시작 시 환경 변수 검증 스키마
 * 모든 환경 변수는 필수. 검증 실패 시 구동을 중단하고 오류 메시지를 출력한다.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .required()
    .messages({
      'any.required': 'NODE_ENV is required',
    }),

  MONGODB_URL: Joi.string().min(1).required().messages({
    'string.empty': 'MONGODB_URL must not be empty',
    'any.required': 'MONGODB_URL is required',
  }),

  REDIS_URL: Joi.string().min(1).required().messages({
    'string.empty': 'REDIS_URL must not be empty',
    'any.required': 'REDIS_URL is required',
  }),

  KAFKA_BROKERS: Joi.string().min(1).required().messages({
    'string.empty': 'KAFKA_BROKERS must not be empty',
    'any.required': 'KAFKA_BROKERS is required',
  }),

  KAFKA_CLIENT_ID: Joi.string().min(1).required().messages({
    'string.empty': 'KAFKA_CLIENT_ID must not be empty',
    'any.required': 'KAFKA_CLIENT_ID is required',
  }),

  POSTGRESQL_URL: Joi.string().min(1).required().messages({
    'string.empty': 'POSTGRESQL_URL must not be empty',
    'any.required': 'POSTGRESQL_URL is required',
  }),

  OPENAI_API_KEY: Joi.string().min(1).required().messages({
    'string.empty': 'OPENAI_API_KEY must not be empty',
    'any.required': 'OPENAI_API_KEY is required',
  }),

  OPENAI_CHAT_MODEL: Joi.string().min(1).required().messages({
    'string.empty': 'OPENAI_CHAT_MODEL must not be empty',
    'any.required': 'OPENAI_CHAT_MODEL is required',
  }),

  OPENAI_EMBEDDING_MODEL: Joi.string().min(1).required().messages({
    'string.empty': 'OPENAI_EMBEDDING_MODEL must not be empty',
    'any.required': 'OPENAI_EMBEDDING_MODEL is required',
  }),

  PUBLIC_DATA_API_KEY: Joi.string().min(1).required().messages({
    'string.empty': 'PUBLIC_DATA_API_KEY must not be empty',
    'any.required': 'PUBLIC_DATA_API_KEY is required',
  }),

  OPENAI_BATCH_MODEL: Joi.string().min(1).required().messages({
    'string.empty': 'OPENAI_BATCH_MODEL must not be empty',
    'any.required': 'OPENAI_BATCH_MODEL is required',
  }),

  ...buildObservabilityEnvRules({ requireMetricsPort: true }),
});

export const envValidationOptions = {
  allowUnknown: true,
  abortEarly: false,
} as const;
