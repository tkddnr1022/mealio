import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatbotLog, ChatbotLogSchema } from '@cook/shared';
import { OpenAIService } from '../../integrations/openai/openai.service.js';
import { ChatbotRequestConsumer } from './chatbot-request.consumer.js';
import { ProcessChatHandler } from './handlers/process-chat.handler.js';
import { SaveChatLogHandler } from './handlers/save-chat-log.handler.js';
import { UpdateContextHandler } from './handlers/update-context.handler.js';

@Module({
  imports: [
    // ChatbotLog 전용 스키마 등록 (AppModule 전역 등록과 중복되더라도 문제 없음)
    MongooseModule.forFeature([{ name: ChatbotLog.name, schema: ChatbotLogSchema }]),
  ],
  providers: [
    OpenAIService,
    ChatbotRequestConsumer,
    ProcessChatHandler,
    SaveChatLogHandler,
    UpdateContextHandler,
  ],
})
export class ChatbotRequestsConsumerModule {}

