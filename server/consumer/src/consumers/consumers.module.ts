import { Module } from '@nestjs/common';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { RecipeGenerationModule } from './recipe-generation/recipe-generation.module';
import { ChatbotRequestModule } from './chatbot-request/chatbot-request.module';
import { UserEventsModule } from './user-events/user-events.module';
import { ActivityEventsModule } from './activity-events/activity-events.module';
import { CacheInvalidationModule } from './cache-invalidation/cache-invalidation.module';

/**
 * 다중 Kafka consumer 인스턴스 등록.
 * - recipe-generation-group → RecipeGenerationProcessor
 * - chatbot-group → ChatbotRequestProcessor
 * - analytics-group → UserEventsProcessor (user-events)
 * - activity-events-group → ActivityEventsProcessor (EventLog 기록, 비로그인 포함)
 * - cache-invalidation-group → CacheInvalidationProcessor
 */
@Module({
  imports: [
    KafkaModule,
    RecipeGenerationModule,
    ChatbotRequestModule,
    UserEventsModule,
    ActivityEventsModule,
    CacheInvalidationModule,
  ],
})
export class ConsumersModule {}
