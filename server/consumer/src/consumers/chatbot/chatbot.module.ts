import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChatbotLog,
  ChatbotLogSchema,
  UserIngredient,
  UserIngredientSchema,
} from '@cook/shared';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { OpenAIModule } from 'src/integrations/openai/openai.module';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { ChatbotLogRepository } from 'src/persistence/repositories/mongodb/chatbot-log.repository';
import { ChatbotRequestProcessor } from './chatbot-requests/chatbot-request.processor';
import { ChatbotConsumer } from './chatbot.consumer';
import { ProcessChatHandler } from './chatbot-requests/handlers/ProcessChatHandler';
import { SaveChatLogHandler } from './chatbot-requests/handlers/SaveChatLogHandler';
import { SearchRecipesHandler } from './chatbot-requests/handlers/SearchRecipesHandler';
import { UserIngredientsHandler } from './chatbot-requests/handlers/UserIngredientsHandler';
import { ToolDispatcher } from './chatbot-requests/tools/tool-dispatcher';

@Module({
  imports: [
    KafkaModule,
    OpenAIModule,
    MongooseModule.forFeature([
      { name: ChatbotLog.name, schema: ChatbotLogSchema },
      { name: UserIngredient.name, schema: UserIngredientSchema },
    ]),
  ],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    ChatbotLogRepository,
    SearchRecipesHandler,
    UserIngredientsHandler,
    ToolDispatcher,
    ProcessChatHandler,
    SaveChatLogHandler,
    ChatbotRequestProcessor,
    ChatbotConsumer,
  ],
  exports: [ChatbotRequestProcessor],
})
export class ChatbotConsumerModule {}
