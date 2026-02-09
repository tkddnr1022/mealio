import { Injectable } from '@nestjs/common';
import { KafkaService } from 'src/integrations/kafka/kafka.service';
import { CONSUMER_GROUPS } from 'src/config/consumer-groups';
import { BaseConsumer } from '../base/base.consumer';
import { UserEventsProcessor } from './user-events.processor';

/** analytics-group → UserEventsProcessor (USER_EVENTS 구독) */
@Injectable()
export class UserEventsConsumer extends BaseConsumer {
  constructor(
    kafkaService: KafkaService,
    userEventsProcessor: UserEventsProcessor,
  ) {
    super(
      kafkaService,
      CONSUMER_GROUPS.USER_EVENTS,
      [userEventsProcessor],
      UserEventsConsumer.name,
    );
  }
}
