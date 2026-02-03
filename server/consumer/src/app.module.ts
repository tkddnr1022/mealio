import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  mongooseConfig,
  RedisModule,
  PrismaModule,
  ChatbotLog,
  ChatbotLogSchema,
} from '@cook/shared';
import {
  envValidationOptions,
  envValidationSchema,
} from './config/env.validation';
import { OpenAIModule } from './integrations/openai/openai.module';
import { ChatbotRequestsConsumerModule } from './consumers/chatbot-requests/chatbot-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: envValidationOptions,
    }),
    // PostgreSQL (Prisma) — SearchRecipesHandler
    PrismaModule,
    // MongoDB (ChatbotLog) 연결
    MongooseModule.forRootAsync({
      useFactory: () => mongooseConfig,
    }),
    MongooseModule.forFeature([
      { name: ChatbotLog.name, schema: ChatbotLogSchema },
    ]),
    // Redis (SSE 스트림 채널 발행용)
    RedisModule,
    // OpenAI (GPT API 래퍼, 레이트 리미터)
    OpenAIModule,
    // Kafka chatbot-requests consumer 모듈
    ChatbotRequestsConsumerModule,
  ],
})
export class AppModule {}
