import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EventLog,
  EventLogSchema,
  Inventory,
  InventorySchema,
} from '@cook/shared';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { UserRepository } from 'src/persistence/repositories/postgresql/user.repository';
import { EventLogRepository } from 'src/persistence/repositories/mongodb/event-log.repository';
import { InventoryRepository } from 'src/persistence/repositories/mongodb/inventory.repository';
import { CacheInvalidationModule } from 'src/consumers/cache-invalidation/cache-invalidation.module';
import { UserEventsProcessor } from './user-events.processor';
import { UserEventsConsumer } from './user-events.consumer';
import { UpdateUserProfileHandler } from './handlers/UpdateUserProfileHandler';
import { TrackUserActivityHandler } from './handlers/TrackUserActivityHandler';
import { RecommendationHandler } from './handlers/RecommendationHandler';
import { UpdateInventoryHandler } from './handlers/UpdateInventoryHandler';

@Module({
  imports: [
    KafkaModule,
    CacheInvalidationModule,
    MongooseModule.forFeature([
      { name: EventLog.name, schema: EventLogSchema },
      { name: Inventory.name, schema: InventorySchema },
    ]),
  ],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    UserRepository,
    EventLogRepository,
    InventoryRepository,
    UpdateUserProfileHandler,
    TrackUserActivityHandler,
    RecommendationHandler,
    UpdateInventoryHandler,
    UserEventsProcessor,
    UserEventsConsumer,
  ],
  exports: [UserEventsProcessor],
})
export class UserEventsModule {}
