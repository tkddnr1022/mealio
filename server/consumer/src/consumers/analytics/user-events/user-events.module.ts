import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  EventLog,
  EventLogSchema,
  UserIngredient,
  UserIngredientSchema,
} from '@cook/shared';
import { RetryStrategy } from '../../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { UserRepository } from 'src/persistence/repositories/postgresql/user.repository';
import { EventLogRepository } from 'src/persistence/repositories/mongodb/event-log.repository';
import { UserIngredientRepository } from 'src/persistence/repositories/mongodb/user-ingredient.repository';
import { CacheInvalidationModule } from 'src/consumers/cache-invalidation/cache-invalidation.module';
import { UserEventProcessor } from './user-event.processor';
import { UpdateUserProfileHandler } from './handlers/UpdateUserProfileHandler';
import { TrackUserActivityHandler } from './handlers/TrackUserActivityHandler';
import { RecommendationHandler } from './handlers/RecommendationHandler';
import { UpdateUserIngredientHandler } from './handlers/UpdateUserIngredientHandler';

@Module({
  imports: [
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
    UserEventProcessor,
  ],
  exports: [UserEventProcessor],
})
export class UserEventsConsumerModule {}
