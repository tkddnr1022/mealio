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
import { IngredientRepository } from '../../persistence/repositories/postgresql/ingredient.repository';
import { RecipeIngredientRepository } from '../../persistence/repositories/postgresql/recipe-ingredient.repository';
import { RecipeIngestionJobRepository } from '../../persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { RecipeCreationTransaction } from '../../persistence/transactions/recipe-creation.transaction';
import {
  ConsumerMetricsService,
  OBSERVABILITY_CONFIG,
} from '../../reliability/monitoring/consumer-metrics.service';
import { CategoryResolverService } from '../../consumers/recipe-ingestion-persist/services/category-resolver.service';
import { IngredientMatcherService } from '../../consumers/recipe-ingestion-persist/services/ingredient-matcher.service';
import { PersistService } from './services/persist.service';

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
  ],
  providers: [
    {
      provide: OBSERVABILITY_CONFIG,
      useFactory: () =>
        createObservabilityConfig('consumer', { requireMetricsPort: false }),
    },
    ConsumerMetricsService,
    RecipeIngestionJobRepository,
    IngredientRepository,
    RecipeIngredientRepository,
    CategoryResolverService,
    IngredientMatcherService,
    RecipeCreationTransaction,
    PersistService,
  ],
  exports: [PersistService],
})
export class RecipeIngestionPersistJobModule {}
