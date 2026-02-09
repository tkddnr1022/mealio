import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChatbotLog,
  ChatbotLogSchema,
  EventLog,
  EventLogSchema,
  UserIngredient,
  UserIngredientSchema,
} from '@cook/shared';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { OpenAIModule } from 'src/integrations/openai/openai.module';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { ChatbotLogRepository } from 'src/persistence/repositories/mongodb/chatbot-log.repository';
import { EventLogRepository } from 'src/persistence/repositories/mongodb/event-log.repository';
import { ChatbotRequestProcessor } from './chatbot-request.processor';
import { ChatbotRequestConsumer } from './chatbot-request.consumer';
import { ProcessChatHandler } from './handlers/ProcessChatHandler';
import { SaveChatLogHandler } from './handlers/SaveChatLogHandler';
import { SearchRecipesHandler } from './handlers/SearchRecipesHandler';
import { UserIngredientsHandler } from './handlers/UserIngredientsHandler';
import { ToolDispatcher } from './tools/tool-dispatcher';

@Module({
  imports: [
    KafkaModule,
    OpenAIModule,
    MongooseModule.forFeature([
      { name: ChatbotLog.name, schema: ChatbotLogSchema },
      { name: EventLog.name, schema: EventLogSchema },
      { name: UserIngredient.name, schema: UserIngredientSchema },
    ]),
  ],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    ChatbotLogRepository,
    EventLogRepository,
    SearchRecipesHandler,
    UserIngredientsHandler,
    ToolDispatcher,
    ProcessChatHandler,
    SaveChatLogHandler,
    ChatbotRequestProcessor,
    ChatbotRequestConsumer,
  ],
  exports: [ChatbotRequestProcessor],
})
export class ChatbotRequestModule {}
