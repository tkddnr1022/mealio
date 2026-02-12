import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventLog, EventLogSchema } from '@cook/shared';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { EventLogRepository } from 'src/persistence/repositories/mongodb/event-log.repository';
import { RecipeRepository } from 'src/persistence/repositories/postgresql/recipe.repository';
import { ActivityEventsProcessor } from './activity-events.processor';
import { ActivityEventsConsumer } from './activity-events.consumer';

@Module({
  imports: [
    KafkaModule,
    MongooseModule.forFeature([
      { name: EventLog.name, schema: EventLogSchema },
    ]),
  ],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    EventLogRepository,
    RecipeRepository,
    ActivityEventsProcessor,
    ActivityEventsConsumer,
  ],
  exports: [ActivityEventsProcessor],
})
export class ActivityEventsModule {}
