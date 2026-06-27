import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  createObservabilityConfig,
  MongooseSchemasModule,
  PrismaModule,
} from '@mealio/shared';
import {
  envValidationOptions,
  envValidationSchema,
} from '../../config/env.validation';
import { mongooseConnectionPoolConfig } from '../../policy/mongoose-pool.policy';
import { prismaConnectionPoolConfig } from '../../policy/prisma-pool.policy';
import { OpenAIModule } from '../../integrations/openai/openai.module';
import { RecipeCategoryRepository } from '../../persistence/repositories/postgresql/recipe-category.repository';
import { IngredientCategoryRepository } from '../../persistence/repositories/postgresql/ingredient-category.repository';
import { RecipeRepository } from '../../persistence/repositories/postgresql/recipe.repository';
import { IngredientEmbeddingRepository } from '../../persistence/repositories/postgresql/ingredient-embedding.repository';
import { IngredientRepository } from '../../persistence/repositories/postgresql/ingredient.repository';
import { RecipeIngredientRepository } from '../../persistence/repositories/postgresql/recipe-ingredient.repository';
import { RecipeIngestionJobRepository } from '../../persistence/repositories/mongodb/recipe-ingestion-job.repository';
import {
  ConsumerMetricsService,
  OBSERVABILITY_CONFIG,
} from '../../reliability/monitoring/consumer-metrics.service';
import { CategoryResolverService } from './domains/category-resolver.domain';
import { IngredientMatcherService } from './domains/ingredient-matcher.domain';
import { PersistService } from 'src/jobs/recipe-ingestion-persist/services/persist.service';
import { RecipeCreationService } from './domains/recipe-creation.domain';
import { KafkaModule } from '../../integrations/kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: envValidationOptions,
      envFilePath: [
        `.env.${process.env.APP_ENV}.local`,
        '.env.local',
        `.env.${process.env.APP_ENV}`,
        '.env',
      ],
    }),
    MongooseSchemasModule.forRoot(mongooseConnectionPoolConfig),
    PrismaModule.forRoot(prismaConnectionPoolConfig),
    KafkaModule,
    OpenAIModule,
  ],
  providers: [
    {
      provide: OBSERVABILITY_CONFIG,
      useFactory: () =>
        createObservabilityConfig('consumer'),
    },
    ConsumerMetricsService,
    RecipeIngestionJobRepository,
    RecipeCategoryRepository,
    IngredientCategoryRepository,
    RecipeRepository,
    IngredientEmbeddingRepository,
    IngredientRepository,
    RecipeIngredientRepository,
    CategoryResolverService,
    IngredientMatcherService,
    RecipeCreationService,
    PersistService,
  ],
  exports: [PersistService],
})
export class RecipeIngestionPersistJobModule {}
