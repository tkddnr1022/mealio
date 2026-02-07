import { Module } from '@nestjs/common';
import { RetryStrategy } from '../../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { SearchLogProcessor } from './search-log.processor';

@Module({
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    SearchLogProcessor,
  ],
  exports: [SearchLogProcessor],
})
export class SearchLogsModule {}
