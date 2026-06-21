import { Module } from '@nestjs/common';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { RecipeIngestionSubmitModule } from 'src/jobs/recipe-ingestion-submit/recipe-ingestion-submit.module';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { RecipeIngestionSubmitProcessor } from './recipe-ingestion-submit.processor';
import { RecipeIngestionSubmitConsumer } from './recipe-ingestion-submit.consumer';
import { SubmitRecipeIngestionHandler } from './handlers/SubmitRecipeIngestionHandler';

@Module({
  imports: [KafkaModule, RecipeIngestionSubmitModule],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    SubmitRecipeIngestionHandler,
    RecipeIngestionSubmitProcessor,
    RecipeIngestionSubmitConsumer,
  ],
  exports: [RecipeIngestionSubmitProcessor],
})
export class RecipeIngestionSubmitConsumerModule {}
