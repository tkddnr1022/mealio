import { Module } from '@nestjs/common';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { ActivityEventsModule } from './activity-events/activity-events.module';
import { RetryStrategy } from './base/retry.strategy';
import { CacheInvalidationModule } from './cache-invalidation/cache-invalidation.module';
import { ChatbotRequestModule } from './chatbot-request/chatbot-request.module';
import { RecipeIngestionEmbedSubmitConsumerModule } from './recipe-ingestion-embed-submit/recipe-ingestion-embed-submit.module';
import { RecipeIngestionParseSubmitConsumerModule } from './recipe-ingestion-parse-submit/recipe-ingestion-parse-submit.module';
import { RecipeIngestionPersistModule } from './recipe-ingestion-persist/recipe-ingestion-persist.module';
import { UserEventsModule } from './user-events/user-events.module';

@Module({
  imports: [
    KafkaModule,
    ChatbotRequestModule,
    UserEventsModule,
    ActivityEventsModule,
    CacheInvalidationModule,
    RecipeIngestionParseSubmitConsumerModule,
    RecipeIngestionPersistModule,
    RecipeIngestionEmbedSubmitConsumerModule,
  ],
  providers: [RetryStrategy],
})
export class ConsumersModule {}
