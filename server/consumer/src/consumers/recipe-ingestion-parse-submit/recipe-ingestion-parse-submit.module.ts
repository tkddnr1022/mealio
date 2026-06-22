import { Module } from '@nestjs/common';
import { RecipeIngestionParseSubmitModule } from 'src/jobs/recipe-ingestion-parse-submit/recipe-ingestion-parse-submit.module';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { RetryStrategy } from '../base/retry.strategy';
import { ParseSubmitRecipeIngestionHandler } from './handlers/ParseSubmitRecipeIngestionHandler';
import { RecipeIngestionParseSubmitConsumer } from './recipe-ingestion-parse-submit.consumer';
import { RecipeIngestionParseSubmitProcessor } from './recipe-ingestion-parse-submit.processor';

@Module({
  imports: [KafkaModule, RecipeIngestionParseSubmitModule],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    ParseSubmitRecipeIngestionHandler,
    RecipeIngestionParseSubmitProcessor,
    RecipeIngestionParseSubmitConsumer,
  ],
  exports: [RecipeIngestionParseSubmitProcessor],
})
export class RecipeIngestionParseSubmitConsumerModule {}
