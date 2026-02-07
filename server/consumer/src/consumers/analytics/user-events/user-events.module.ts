import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventLog, EventLogSchema } from '@cook/shared';
import { RetryStrategy } from '../../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { UserRepository } from 'src/persistence/repositories/postgresql/user.repository';
import { EventLogRepository } from 'src/persistence/repositories/mongodb/event-log.repository';
import { UserEventProcessor } from './user-event.processor';
import { UpdateUserProfileHandler } from './handlers/UpdateUserProfileHandler';
import { TrackUserActivityHandler } from './handlers/TrackUserActivityHandler';
import { RecommendationHandler } from './handlers/RecommendationHandler';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventLog.name, schema: EventLogSchema },
    ]),
  ],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    UserRepository,
    EventLogRepository,
    UpdateUserProfileHandler,
    TrackUserActivityHandler,
    RecommendationHandler,
    UserEventProcessor,
  ],
  exports: [UserEventProcessor],
})
export class UserEventsConsumerModule {}
