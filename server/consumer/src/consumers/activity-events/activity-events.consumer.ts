import { Injectable } from '@nestjs/common';
import { KafkaService } from 'src/integrations/kafka/kafka.service';
import { CONSUMER_GROUPS } from 'src/config/consumer-groups';
import { BaseConsumer } from '../base/base.consumer';
import { ActivityEventsProcessor } from './activity-events.processor';

/** activity-events-group → ActivityEventsProcessor (ACTIVITY_EVENTS 구독, EventLog 기록) */
@Injectable()
export class ActivityEventsConsumer extends BaseConsumer {
  constructor(
    kafkaService: KafkaService,
    activityEventsProcessor: ActivityEventsProcessor,
  ) {
    super(
      kafkaService,
      CONSUMER_GROUPS.ACTIVITY_EVENTS,
      [activityEventsProcessor],
      ActivityEventsConsumer.name,
    );
  }
}
