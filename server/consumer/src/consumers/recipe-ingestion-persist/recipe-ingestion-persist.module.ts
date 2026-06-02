import { Module } from '@nestjs/common';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { RecipeIngestionPersistJobModule } from 'src/jobs/recipe-ingestion-persist/recipe-ingestion-persist.module';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { RecipeIngestionPersistProcessor } from './recipe-ingestion-persist.processor';
import { RecipeIngestionPersistConsumer } from './recipe-ingestion-persist.consumer';
import { PersistRecipeHandler } from './handlers/PersistRecipeHandler';

@Module({
  imports: [KafkaModule, RecipeIngestionPersistJobModule],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    PersistRecipeHandler,
    RecipeIngestionPersistProcessor,
    RecipeIngestionPersistConsumer,
  ],
  exports: [RecipeIngestionPersistProcessor],
})
export class RecipeIngestionPersistModule {}
