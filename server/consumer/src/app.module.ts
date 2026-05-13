import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  MongooseSchemasModule,
  PrismaModule,
  RedisModule,
} from '@mealio/shared';
import {
  envValidationOptions,
  envValidationSchema,
} from './config/env.validation';
import { OpenAIModule } from './integrations/openai/openai.module';
import { ConsumersModule } from './consumers/consumers.module';
import { mongooseConnectionPoolConfig } from './config/mongoose-pool.config';
import { prismaConnectionPoolConfig } from './config/prisma-pool.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: envValidationOptions,
    }),
    // PostgreSQL (Prisma) — SearchRecipesHandler (config 주입)
    PrismaModule.forRoot(prismaConnectionPoolConfig),
    // MongoDB (ChatbotLog 등) — 스키마·URL·공용 옵션은 shared에서 관리
    MongooseSchemasModule.forRoot(mongooseConnectionPoolConfig),
    // Redis (SSE 스트림 채널 발행용)
    RedisModule,
    // OpenAI (GPT API 래퍼, 레이트 리미터)
    OpenAIModule,
    // 다중 Kafka consumer 인스턴스 (그룹별 분리)
    ConsumersModule,
  ],
})
export class AppModule {}
