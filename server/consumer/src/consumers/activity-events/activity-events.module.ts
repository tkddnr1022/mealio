import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventLog, EventLogSchema } from '@mealio/shared';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { EventLogRepository } from 'src/persistence/repositories/mongodb/event-log.repository';
import { RecipeRepository } from 'src/persistence/repositories/postgresql/recipe.repository';
import { RecommendationRepository } from 'src/persistence/repositories/postgresql/recommendation.repository';
import { CacheInvalidationModule } from '../cache-invalidation/cache-invalidation.module';
import { ActivityEventsProcessor } from './activity-events.processor';
import { ActivityEventsConsumer } from './activity-events.consumer';
import { ActivityRecommendationService } from './services/activity-recommendation.service';

@Module({
  imports: [
    KafkaModule,
    CacheInvalidationModule,
    MongooseModule.forFeature([
      { name: EventLog.name, schema: EventLogSchema },
    ]),
  ],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    EventLogRepository,
    RecipeRepository,
    RecommendationRepository,
    ActivityRecommendationService,
    ActivityEventsProcessor,
    ActivityEventsConsumer,
  ],
  exports: [ActivityEventsProcessor],
})
export class ActivityEventsModule {}
