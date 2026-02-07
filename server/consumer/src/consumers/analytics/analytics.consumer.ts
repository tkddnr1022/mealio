import { Injectable } from '@nestjs/common';
import { KafkaService } from 'src/integrations/kafka/kafka.service';
import { CONSUMER_GROUPS } from 'src/config/consumer-groups';
import { BaseConsumer } from '../base/base.consumer';
import { SearchLogProcessor } from './search-logs/search-log.processor';
import { UserEventProcessor } from './user-events/user-event.processor';

/** KafkaConsumer3: analytics-group → SearchLogProcessor, UserEventProcessor */
@Injectable()
export class AnalyticsConsumer extends BaseConsumer {
  constructor(
    kafkaService: KafkaService,
    searchLogProcessor: SearchLogProcessor,
    userEventProcessor: UserEventProcessor,
  ) {
    super(
      kafkaService,
      CONSUMER_GROUPS.ANALYTICS,
      [searchLogProcessor, userEventProcessor],
      AnalyticsConsumer.name,
    );
  }
}
