import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChatbotLog,
  ChatbotLogSchema,
  UserIngredient,
  UserIngredientSchema,
} from '@cook/shared';
import { OpenAIModule } from 'src/integrations/openai/openai.module';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { ChatbotRequestConsumer } from './chatbot-request.consumer';
import { ProcessChatHandler } from './handlers/ProcessChatHandler';
import { SaveChatLogHandler } from './handlers/SaveChatLogHandler';
import { SearchRecipesHandler } from './handlers/SearchRecipesHandler';
import { UserIngredientsHandler } from './handlers/UserIngredientsHandler';
import { ToolDispatcher } from './tools/tool-dispatcher';

@Module({
  imports: [
    OpenAIModule,
    MongooseModule.forFeature([
      { name: ChatbotLog.name, schema: ChatbotLogSchema },
      { name: UserIngredient.name, schema: UserIngredientSchema },
    ]),
  ],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    SearchRecipesHandler,
    UserIngredientsHandler,
    ToolDispatcher,
    ProcessChatHandler,
    SaveChatLogHandler,
    ChatbotRequestConsumer,
  ],
})
export class ChatbotRequestsConsumerModule {}
