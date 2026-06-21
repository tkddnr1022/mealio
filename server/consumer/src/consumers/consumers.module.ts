import { Module } from '@nestjs/common';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { ChatbotRequestModule } from './chatbot-request/chatbot-request.module';
import { UserEventsModule } from './user-events/user-events.module';
import { ActivityEventsModule } from './activity-events/activity-events.module';
import { CacheInvalidationModule } from './cache-invalidation/cache-invalidation.module';
import { RecipeIngestionPersistModule } from './recipe-ingestion-persist/recipe-ingestion-persist.module';
import { RecipeIngestionSubmitConsumerModule } from './recipe-ingestion-submit/recipe-ingestion-submit.module';

/**
 * 다중 Kafka consumer 인스턴스 등록.
 * - chatbot-group → ChatbotRequestProcessor
 * - analytics-group → UserEventsProcessor (user-events)
 * - activity-events-group → ActivityEventsProcessor (EventLog 기록, 비로그인 포함)
 * - cache-invalidation-group → CacheInvalidationProcessor
 * - recipe-ingestion-submit-group → RecipeIngestionSubmitProcessor
 * - recipe-ingestion-persist-group → RecipeIngestionPersistProcessor
 */
@Module({
  imports: [
    KafkaModule,
    ChatbotRequestModule,
    UserEventsModule,
    ActivityEventsModule,
    CacheInvalidationModule,
    RecipeIngestionSubmitConsumerModule,
    RecipeIngestionPersistModule,
  ],
})
export class ConsumersModule {}
