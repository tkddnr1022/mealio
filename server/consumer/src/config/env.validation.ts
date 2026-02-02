import Joi from 'joi';

/**
 * Consumer 앱 시작 시 환경 변수 검증 스키마
 * 검증 실패 시 구동을 중단하고 오류 메시지를 출력한다.
 */
export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  MONGODB_URL: Joi.string().min(1).required().messages({
    'string.empty': 'MONGODB_URL must not be empty',
    'any.required': 'MONGODB_URL is required',
  }),

  REDIS_URL: Joi.string().default('redis://localhost:6379').messages({
    'string.empty': 'REDIS_URL must not be empty when provided',
  }),

  KAFKA_BROKERS: Joi.string().default('localhost:9092').messages({
    'string.empty': 'KAFKA_BROKERS must not be empty when provided',
  }),

  KAFKA_CLIENT_ID: Joi.string().default('cook-consumer').messages({
    'string.empty': 'KAFKA_CLIENT_ID must not be empty when provided',
  }),

  KAFKA_CONSUMER_GROUP_ID: Joi.string()
    .default('cook-chatbot-consumers')
    .messages({
      'string.empty': 'KAFKA_CONSUMER_GROUP_ID must not be empty when provided',
    }),

  OPENAI_API_KEY: Joi.string().min(1).required().messages({
    'string.empty': 'OPENAI_API_KEY must not be empty',
    'any.required': 'OPENAI_API_KEY is required',
  }),

  OPENAI_CHAT_MODEL: Joi.string().default('gpt-4.1-mini').messages({
    'string.empty': 'OPENAI_CHAT_MODEL must not be empty when provided',
  }),
});

export const envValidationOptions = {
  allowUnknown: true,
  abortEarly: false,
} as const;
