import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ChatbotConversation,
  ChatbotConversationSchema,
  ChatbotLog,
  ChatbotLogSchema,
  EventLog,
  EventLogSchema,
  Inventory,
  InventorySchema,
} from '@mealio/shared';
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
import { SyncConversationMetaHandler } from './handlers/SyncConversationMetaHandler';
import { ChatbotConversationRepository } from 'src/persistence/repositories/mongodb/chatbot-conversation.repository';
import { SearchRecipesHandler } from './handlers/SearchRecipesHandler';
import { FoodCategoriesHandler } from './handlers/FoodCategoriesHandler';
import { InventoryHandler } from './handlers/InventoryHandler';
import { ToolDispatcher } from './tools/tool-dispatcher';
import { ChatbotCreditService } from './services/chatbot-credit.service';
import { RecipeEmbeddingRepository } from 'src/persistence/repositories/postgresql/recipe-embedding.repository';
import { RecipeEmbeddingService } from './services/recipe-embedding.service';
import { RecipeSearchQueryService } from './services/recipe-search-query.service';
import { RecipeSearchQueryExpansionService } from './services/recipe-search-query-expansion.service';
import { FinalizeRecipeSelectionHandler } from './handlers/FinalizeRecipeSelectionHandler';

@Module({
  imports: [
    KafkaModule,
    OpenAIModule,
    MongooseModule.forFeature([
      { name: ChatbotLog.name, schema: ChatbotLogSchema },
      {
        name: ChatbotConversation.name,
        schema: ChatbotConversationSchema,
      },
      { name: EventLog.name, schema: EventLogSchema },
      { name: Inventory.name, schema: InventorySchema },
    ]),
  ],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    ChatbotLogRepository,
    EventLogRepository,
    SearchRecipesHandler,
    FoodCategoriesHandler,
    FinalizeRecipeSelectionHandler,
    RecipeEmbeddingRepository,
    RecipeEmbeddingService,
    RecipeSearchQueryService,
    RecipeSearchQueryExpansionService,
    InventoryHandler,
    ToolDispatcher,
    ProcessChatHandler,
    SaveChatLogHandler,
    ChatbotConversationRepository,
    SyncConversationMetaHandler,
    ChatbotRequestProcessor,
    ChatbotRequestConsumer,
    ChatbotCreditService,
  ],
  exports: [ChatbotRequestProcessor],
})
export class ChatbotRequestModule {}
