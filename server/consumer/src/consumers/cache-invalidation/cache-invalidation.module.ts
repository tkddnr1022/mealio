import { Module } from '@nestjs/common';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { CacheInvalidationProcessor } from './cache-invalidation/cache-invalidation.processor';
import { CacheInvalidationConsumer } from './cache-invalidation.consumer';

@Module({
  imports: [KafkaModule],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    CacheInvalidationProcessor,
    CacheInvalidationConsumer,
  ],
})
export class CacheInvalidationModule {}
