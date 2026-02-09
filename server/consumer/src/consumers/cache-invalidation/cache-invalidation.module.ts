import { Module } from '@nestjs/common';
import { RedisModule } from '@cook/shared';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { CacheInvalidationRequestService } from './cache-invalidation-request.service';
import { CacheInvalidationProcessor } from './cache-invalidation.processor';
import { RedisInvalidationHandler } from './redis-invalidation.handler';
import { CacheInvalidationConsumer } from './cache-invalidation.consumer';

@Module({
  imports: [KafkaModule, RedisModule],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    CacheInvalidationRequestService,
    RedisInvalidationHandler,
    CacheInvalidationProcessor,
    CacheInvalidationConsumer,
  ],
  exports: [CacheInvalidationRequestService],
})
export class CacheInvalidationModule {}
