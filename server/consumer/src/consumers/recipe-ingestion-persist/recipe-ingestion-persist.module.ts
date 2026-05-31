import { Module } from '@nestjs/common';
import { KafkaModule } from 'src/integrations/kafka/kafka.module';
import { RetryStrategy } from '../base/retry.strategy';
import { DeadLetterHandler } from 'src/reliability/dead-letter/dlq.handler';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { IngredientRepository } from 'src/persistence/repositories/postgresql/ingredient.repository';
import { RecipeIngredientRepository } from 'src/persistence/repositories/postgresql/recipe-ingredient.repository';
import { RecipeCreationTransaction } from 'src/persistence/transactions/recipe-creation.transaction';
import { RecipeIngestionPersistProcessor } from './recipe-ingestion-persist.processor';
import { RecipeIngestionPersistConsumer } from './recipe-ingestion-persist.consumer';
import { PersistRecipeHandler } from './handlers/PersistRecipeHandler';
import { IngredientMatcherService } from './services/ingredient-matcher.service';
import { CategoryResolverService } from './services/category-resolver.service';

@Module({
  imports: [KafkaModule],
  providers: [
    RetryStrategy,
    DeadLetterHandler,
    RecipeIngestionJobRepository,
    IngredientRepository,
    RecipeIngredientRepository,
    CategoryResolverService,
    IngredientMatcherService,
    RecipeCreationTransaction,
    PersistRecipeHandler,
    RecipeIngestionPersistProcessor,
    RecipeIngestionPersistConsumer,
  ],
  exports: [RecipeIngestionPersistProcessor],
})
export class RecipeIngestionPersistModule {}
