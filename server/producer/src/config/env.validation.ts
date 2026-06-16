import Joi from 'joi';
import { buildObservabilityEnvRules } from '@mealio/shared';

/**
 * 앱 시작 시 환경 변수 검증 스키마
 * 모든 환경 변수는 필수. 검증 실패 시 구동을 중단하고 오류 메시지를 출력한다.
 */
export const envValidationSchema = Joi.object({
  APP_ENV: Joi.string()
    .valid('local', 'development', 'production', 'test')
    .required()
    .messages({
      'any.required': 'APP_ENV is required',
    }),

  PORT: Joi.string().pattern(/^\d+$/).required().messages({
    'any.required': 'PORT is required',
  }),

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

  KAFKA_BROKERS: Joi.string().min(1).required().messages({
    'string.empty': 'KAFKA_BROKERS must not be empty',
    'any.required': 'KAFKA_BROKERS is required',
  }),

  KAFKA_CLIENT_ID: Joi.string().min(1).required().messages({
    'string.empty': 'KAFKA_CLIENT_ID must not be empty',
    'any.required': 'KAFKA_CLIENT_ID is required',
  }),

  REDIS_URL: Joi.string().min(1).required().messages({
    'string.empty': 'REDIS_URL must not be empty',
    'any.required': 'REDIS_URL is required',
  }),

  GOOGLE_CLIENT_ID: Joi.string().min(1).required().messages({
    'string.empty': 'GOOGLE_CLIENT_ID must not be empty',
    'any.required': 'GOOGLE_CLIENT_ID is required',
  }),

  GOOGLE_CLIENT_SECRET: Joi.string().min(1).required().messages({
    'string.empty': 'GOOGLE_CLIENT_SECRET must not be empty',
    'any.required': 'GOOGLE_CLIENT_SECRET is required',
  }),

  OAUTH_CALLBACK_BASE_URL: Joi.string().uri().required().messages({
    'any.required': 'OAUTH_CALLBACK_BASE_URL is required',
  }),

  FRONTEND_APP_BASE_URL: Joi.string().uri().required().messages({
    'any.required': 'FRONTEND_APP_BASE_URL is required',
  }),

  KAKAO_CLIENT_ID: Joi.string().min(1).required().messages({
    'string.empty': 'KAKAO_CLIENT_ID must not be empty',
    'any.required': 'KAKAO_CLIENT_ID is required',
  }),

  KAKAO_CLIENT_SECRET: Joi.string().min(1).required().messages({
    'string.empty': 'KAKAO_CLIENT_SECRET must not be empty',
    'any.required': 'KAKAO_CLIENT_SECRET is required',
  }),

  NAVER_CLIENT_ID: Joi.string().min(1).required().messages({
    'string.empty': 'NAVER_CLIENT_ID must not be empty',
    'any.required': 'NAVER_CLIENT_ID is required',
  }),

  NAVER_CLIENT_SECRET: Joi.string().min(1).required().messages({
    'string.empty': 'NAVER_CLIENT_SECRET must not be empty',
    'any.required': 'NAVER_CLIENT_SECRET is required',
  }),

  ...buildObservabilityEnvRules({
    serviceName: 'producer',
    requireMetricsPort: false,
  }),
});

export const envValidationOptions = {
  allowUnknown: true,
  abortEarly: false,
} as const;
