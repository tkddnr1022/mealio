import { Injectable } from '@nestjs/common';
import { KafkaService } from 'src/integrations/kafka/kafka.service';
import { CONSUMER_GROUPS } from 'src/config/consumer-groups';
import { BaseConsumer } from '../base/base.consumer';
import { CacheInvalidationProcessor } from './cache-invalidation.processor';

/** KafkaConsumer4: cache-invalidation-group → CacheInvalidationProcessor */
@Injectable()
export class CacheInvalidationConsumer extends BaseConsumer {
  constructor(
    kafkaService: KafkaService,
    cacheInvalidationProcessor: CacheInvalidationProcessor,
  ) {
    super(
      kafkaService,
      CONSUMER_GROUPS.CACHE_INVALIDATION,
      [cacheInvalidationProcessor],
      CacheInvalidationConsumer.name,
    );
  }
}
