import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  createObservabilityConfig,
  MongooseSchemasModule,
  PrismaModule,
} from '@mealio/shared';
import { OpenAIModule } from 'src/integrations/openai/openai.module';
import {
  envValidationOptions,
  envValidationSchema,
} from 'src/config/env.validation';
import { mongooseConnectionPoolConfig } from 'src/policy/mongoose-pool.policy';
import { prismaConnectionPoolConfig } from 'src/policy/prisma-pool.policy';
import { RecipeIngestionJobRepository } from 'src/persistence/repositories/mongodb/recipe-ingestion-job.repository';
import { IngredientEmbeddingRepository } from 'src/persistence/repositories/postgresql/ingredient-embedding.repository';
import {
  ConsumerMetricsService,
  OBSERVABILITY_CONFIG,
} from 'src/reliability/monitoring/consumer-metrics.service';
import { RecipeRepository } from 'src/persistence/repositories/postgresql/recipe.repository';
import { IngredientRepository } from 'src/persistence/repositories/postgresql/ingredient.repository';
import { RecipeEmbeddingDocumentService } from './integrations/recipe-embedding-document.integration';
import { IngredientEmbeddingDocumentService } from './integrations/ingredient-embedding-document';
import { EmbedSubmitService } from './services/embed-submit.service';

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
    RecipeRepository,
    IngredientRepository,
    IngredientEmbeddingRepository,
    RecipeEmbeddingDocumentService,
    IngredientEmbeddingDocumentService,
    EmbedSubmitService,
  ],
  exports: [EmbedSubmitService],
})
export class RecipeIngestionEmbedSubmitModule {}
