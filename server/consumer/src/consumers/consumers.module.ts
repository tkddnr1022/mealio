import { Module } from '@nestjs/common';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { RecipeGenerationModule } from './recipe-generation/recipe-generation.module';
import { ChatbotConsumerModule } from './chatbot/chatbot.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CacheInvalidationModule } from './cache-invalidation/cache-invalidation.module';

/**
 * 다중 Kafka consumer 인스턴스 등록.
 * - KafkaConsumer1 (recipe-generation-group) → RecipeGenerationProcessor
 * - KafkaConsumer2 (chatbot-group) → ChatbotRequestProcessor
 * - KafkaConsumer3 (analytics-group) → SearchLogProcessor, UserEventProcessor
 * - KafkaConsumer4 (cache-invalidation-group) → CacheInvalidationProcessor
 */
@Module({
  imports: [
    KafkaModule,
    RecipeGenerationModule,
    ChatbotConsumerModule,
    AnalyticsModule,
    CacheInvalidationModule,
  ],
})
export class ConsumersModule {}
