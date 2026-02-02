import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  mongooseConfig,
  RedisModule,
  ChatbotLog,
  ChatbotLogSchema,
} from '@cook/shared';
import { ChatbotRequestsConsumerModule } from './consumers/chatbot-requests/chatbot-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // MongoDB (ChatbotLog) 연결
    MongooseModule.forRootAsync({
      useFactory: () => mongooseConfig,
    }),
    MongooseModule.forFeature([{ name: ChatbotLog.name, schema: ChatbotLogSchema }]),
    // Redis (SSE 스트림 채널 발행용)
    RedisModule,
    // Kafka chatbot-requests consumer 모듈
    ChatbotRequestsConsumerModule,
  ],
})
export class AppModule {}

