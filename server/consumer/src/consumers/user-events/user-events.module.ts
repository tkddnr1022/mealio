import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EventLog,
  EventLogSchema,
  UserIngredient,
  UserIngredientSchema,
} from '@cook/shared';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { UserRepository } from 'src/persistence/repositories/postgresql/user.repository';
import { EventLogRepository } from 'src/persistence/repositories/mongodb/event-log.repository';
import { UserIngredientRepository } from 'src/persistence/repositories/mongodb/user-ingredient.repository';
import { CacheInvalidationModule } from 'src/consumers/cache-invalidation/cache-invalidation.module';
import { UserEventsProcessor } from './user-events.processor';
import { UserEventsConsumer } from './user-events.consumer';
import { UpdateUserProfileHandler } from './handlers/UpdateUserProfileHandler';
import { TrackUserActivityHandler } from './handlers/TrackUserActivityHandler';
import { RecommendationHandler } from './handlers/RecommendationHandler';
import { UpdateUserIngredientHandler } from './handlers/UpdateUserIngredientHandler';

@Module({
  imports: [
    KafkaModule,
    CacheInvalidationModule,
    MongooseModule.forFeature([
      { name: EventLog.name, schema: EventLogSchema },
      { name: UserIngredient.name, schema: UserIngredientSchema },
    ]),
  ],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    UserRepository,
    EventLogRepository,
    UserIngredientRepository,
    UpdateUserProfileHandler,
    TrackUserActivityHandler,
    RecommendationHandler,
    UpdateUserIngredientHandler,
    UserEventsProcessor,
    UserEventsConsumer,
  ],
  exports: [UserEventsProcessor],
})
export class UserEventsModule {}
