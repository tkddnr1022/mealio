import { Module } from '@nestjs/common';
import { RecipeIngestionEmbedSubmitModule as RecipeIngestionEmbedSubmitJobModule } from 'src/jobs/recipe-ingestion-embed-submit/recipe-ingestion-embed-submit.module';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { RetryStrategy } from '../base/retry.strategy';
import { EmbedSubmitRecipeIngestionHandler } from './handlers/EmbedSubmitRecipeIngestionHandler';
import { RecipeIngestionEmbedSubmitConsumer } from './recipe-ingestion-embed-submit.consumer';
import { RecipeIngestionEmbedSubmitProcessor } from './recipe-ingestion-embed-submit.processor';

@Module({
  imports: [KafkaModule, RecipeIngestionEmbedSubmitJobModule],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    EmbedSubmitRecipeIngestionHandler,
    RecipeIngestionEmbedSubmitProcessor,
    RecipeIngestionEmbedSubmitConsumer,
  ],
  exports: [RecipeIngestionEmbedSubmitProcessor],
})
export class RecipeIngestionEmbedSubmitConsumerModule {}
