import { Module } from '@nestjs/common';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { SearchLogsModule } from './search-logs/search-logs.module';
import { UserEventsConsumerModule } from './user-events/user-events.module';
import { AnalyticsConsumer } from './analytics.consumer';

@Module({
  imports: [KafkaModule, SearchLogsModule, UserEventsConsumerModule],
  providers: [AnalyticsConsumer],
})
export class AnalyticsModule {}
